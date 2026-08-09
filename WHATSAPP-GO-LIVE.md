# WhatsApp — go-live runbook

Everything needed on the day Meta credentials arrive, in order.

The build is complete and tested. This document exists because the knowledge is
otherwise spread across a 1,300-line plan, and go-live day is exactly when nobody
wants to be reading one.

**Nothing here sends a message until step 7.** Steps 1–6 are safe to run at any
time, including while the hotel is still deciding.

---

## 0. What we need from the hotel — and what we don't

Only **four** values have to come from Olivia. They are all in
Meta Business Manager → WhatsApp Manager → API Setup.

```bash
WHATSAPP_PHONE_NUMBER_ID        # the Phone number ID, NOT the phone number
WHATSAPP_BUSINESS_ACCOUNT_ID    # the WABA ID
WHATSAPP_ACCESS_TOKEN           # a permanent System User token, not a 24h test token
WHATSAPP_APP_SECRET             # App Settings → Basic → App Secret
```

The rest we set ourselves. Do **not** ask the hotel for them:

| Variable | Who sets it | Note |
|---|---|---|
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | **us** | Any random string we invent, then paste into Meta's webhook config. Meta echoes it back on the handshake. |
| `WHATSAPP_API_VERSION` | optional | Defaults to `v23.0` in code. |
| `WHATSAPP_PROVIDER` | **us** | `cloud` to go live. Anything else uses the mock provider. |

### Two variables that must NOT be set

An earlier credential sheet listed these. **Neither is read anywhere in this
codebase**, and setting them creates a false sense of control:

- `WHATSAPP_DAILY_CAP` — the cap lives in `wa_settings.daily_cap` (currently 250).
- `WHATSAPP_ENABLED` — the kill switch is `wa_settings.enabled`, flipped in the
  settings screen. This one is the dangerous one: it reads like a safety catch,
  so someone could believe sending is disabled by environment when it is not.

---

## 1. Preflight the credentials — before anything else

```bash
npx esbuild scripts/preflight-whatsapp.ts --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/pf.cjs && node --env-file=.env /tmp/pf.cjs
```

Read-only. Sends nothing, creates nothing, changes nothing.

It checks each credential separately and in dependency order, so a failure names
the thing that is actually wrong instead of producing a Graph error that names
none of them. In particular it verifies **the WABA actually owns the phone
number** — which is what catches credentials taken from two different Meta
accounts: individually valid, useless together.

Do not proceed past a failure here. Every later step assumes these work.

---

## 2. Register the webhook

In Meta → WhatsApp → Configuration → Webhooks:

- **Callback URL:** `https://www.oliviaalleppey.com/api/webhooks/whatsapp`
- **Verify token:** whatever we set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` to
- **Subscribe to:** `messages`, `message_template_status_update`

Meta performs a GET handshake immediately. If it fails, the verify token in the
dashboard does not match the environment variable — that is the only cause.

**Without a subscribed app nothing is ever marked delivered or read, and the
inbox stays permanently empty.** A webhook that never arrives produces no error
anywhere, which is why `scripts/preflight-whatsapp.ts` checks for it explicitly
and why the hourly sync cron exists as a backstop.

---

## 3. Stage the templates

```bash
npx esbuild scripts/seed-templates.ts --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/seed.cjs && node --env-file=.env /tmp/seed.cjs
```

Inserts six drafts. Idempotent, and refuses to overwrite anything past `draft` —
once submitted, Meta's copy is authoritative.

| Template | Category | Purpose |
|---|---|---|
| `olivia_reengage_v1` | MARKETING | The permission ask. **The most important one** — it is what turns 10,000 `pending` numbers into a lawful list. |
| `olivia_offer_v1` | MARKETING | The campaign. Carries the tracked link. |
| `olivia_booking_confirm_v1` | UTILITY | Fired by `BookingService` on confirmation. |
| `olivia_payment_failed_v1` | UTILITY | Fired on payment failure. |
| `olivia_prearrival_v1` | UTILITY | T-1 day, hourly cron. |
| `olivia_checkout_review_v1` | UTILITY | Post-stay, hourly cron. |

---

## 4. Review and submit

Go to `/admin/whatsapp/templates`, read each one in the bubble preview, then
submit. Submission needs the `templates.submit` capability, which only `admin`
holds.

**Then wait.** Meta review is typically 24–48 hours and is the longest pole in
this entire project. Nothing below can happen until at least the utility
templates are approved.

Rejections arrive by webhook and appear on the template's status. Our linter
already catches the common causes, so a rejection here is likely to be about
content judgement rather than format — read Meta's reason before editing.

---

## 5. Import the contact list

Independent of everything above — this can happen while waiting on approval.

`/admin/whatsapp/contacts/import`, 5-step wizard. It validates and reports
rejections before committing anything.

**Every imported number lands as `pending`.** Nothing in the system has ever
recorded marketing consent, so the only marketing message any of them may
lawfully receive is `olivia_reengage_v1`. This is the single most important fact
about the launch and it is not a limitation to work around.

---

## 6. Test mode — send to ourselves first

In `/admin/whatsapp/settings`:

1. Add our own numbers to **test numbers**.
2. Leave **test mode ON**. Every send redirects to that whitelist.
3. Set `WHATSAPP_PROVIDER=cloud` and redeploy.
4. Turn the **kill switch on**.

Send one booking confirmation to ourselves and confirm: it arrives, the delivery
ticks update in the inbox, and replying to it opens the 24-hour window.

If that works, the whole chain works — credentials, webhook, templates, dispatcher.

---

## 7. Go live

Turn **test mode off**. That is the moment real guests can receive messages.

Three things must all be true, and each is a deliberate act:

1. templates approved by Meta
2. `WHATSAPP_PROVIDER=cloud`
3. test mode off **and** kill switch on

---

## 8. Warm-up ramp

Do not skip this. A new number that sends 10,000 marketing messages on day one
gets restricted, and a restricted number is very hard to recover.

| Days | Daily cap | What goes out |
|---|---|---|
| 1–3 | 250 | **Utility only.** Booking confirmations and pre-arrival on real bookings. Builds quality rating at ~6× lower cost, with zero marketing-consent risk. |
| 4–7 | 1,000 | `olivia_reengage_v1` to a first slice of `pending` contacts. A permission ask, not an offer. |
| 8–14 | 5,000 | Re-permission continues. First marketing offers go **only** to contacts who tapped "Yes, keep me posted". |
| 15+ | 10,000 | Marketing to the accumulated opted-in pool; re-permission to the remainder. |

Expect the opted-in pool to be a small fraction of 10,000. **That is the correct
outcome, not a failed campaign** — it is what keeps the number alive.

---

## 9. What to watch, daily

- **Quality rating** — `/admin/whatsapp` overview. Yellow → hold the ramp. Red →
  the sync cron halts every campaign and trips the kill switch automatically.
- **Opt-out rate** — auto-halts above 3%. If it is climbing, the copy is wrong,
  not the audience.
- **Failure rate** — auto-halts above 10%.
- **Spend against budget** — warns at 80%, stops marketing at 100%.

The crons that keep this running (already in `vercel.json`):

| Cron | Schedule | Job |
|---|---|---|
| `whatsapp-dispatch` | every 5 min | Sends the queue |
| `whatsapp-automations` | hourly | Pre-arrival and post-stay sweeps |
| `whatsapp-sync` | hourly at :15 | Account health, template status, webhook liveness |
| `whatsapp-retention` | daily 03:30 | Purges raw webhook payloads |

---

## If something goes wrong

**Stop everything:** the kill switch in `/admin/whatsapp/settings`. One toggle,
halts all outbound sending immediately.

**A single campaign misbehaving:** pause or halt it from its detail page.

**Diagnosing a failed send:** the per-recipient table on the campaign carries
Meta's actual error code for each row. `skipped` is not a failure — it means the
consent gate blocked it, which is the system working.

**Nothing is sending at all:** check in this order — kill switch on? test mode
off? `WHATSAPP_PROVIDER=cloud`? template approved? campaign status `sending`?
Then look at `wa_messages.status` directly.
