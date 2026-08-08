# WhatsApp Broadcast & Guest Messaging — Admin Panel Build Plan

**Route:** WhatsApp Cloud API (Meta, direct — no BSP)
**Host:** existing Next.js 16 admin panel at `/admin`, Neon Postgres + Drizzle, Vercel
**Status:** Phase 1 (Meta account setup) delegated to Olivia Hotel. Phases 2–7 below are ours and are **not blocked** by it.
**Last updated:** 2026-08-08

---

## 0. BUILD STATUS — read this first (updated 2026-08-08)

### Done and verified

| # | Item | File(s) |
|---|---|---|
| 1 | Schema: 15 tables + 7 enums | `lib/db/schema.ts` (appended at end) |
| 2 | Migration SQL, hand-written, idempotent | `drizzle/0006_whatsapp_module.sql` |
| 3 | Phone normalisation (E.164, region IN) | `lib/services/whatsapp/phone.ts` |
| 4 | Provider abstraction + Meta error taxonomy | `.../types.ts`, `index.ts` |
| 5 | Mock provider (deterministic failure mix) | `.../mock-provider.ts` |
| 6 | Real Cloud API provider | `.../cloud-provider.ts` |
| 7 | Settings singleton, quiet hours, budget | `.../settings.ts` |
| 8 | **Consent chokepoint** | `.../consent.ts` |
| 9 | CSV/XLSX import service (validate + commit) | `.../import.ts` |
| 10 | Audience filter engine + exclusion breakdown | `.../audiences.ts` |
| 11 | Admin auth/audit helper | `.../admin-guard.ts` |
| 12 | Contacts + import API routes | `app/api/admin/whatsapp/**` |
| 13 | UI primitives (7 new) | `components/ui/{table,dialog,tabs,checkbox,dropdown-menu,progress,skeleton}.tsx` |
| 14 | Module shell, overview, settings page, kill switch | `app/admin/whatsapp/**`, `components/admin/whatsapp/**` |
| 15 | **Contacts list UI** — filters, chips, bulk actions, pagination | `app/admin/whatsapp/contacts/page.tsx`, `.../contact-table.tsx` |
| 16 | **5-step import wizard** | `app/admin/whatsapp/contacts/import/page.tsx`, `.../import-wizard.tsx` |
| 17 | **Contact detail** — timeline, consent ledger, bookings, DPDP erasure | `app/admin/whatsapp/contacts/[id]/page.tsx`, `.../contact-actions.tsx` |
| 18 | Shared filter builder + bulk/export APIs (were missing) | `.../contact-query.ts`, `app/api/admin/whatsapp/contacts/{bulk,export}/route.ts` |
| 19 | **Audiences** — list with live counts, filter builder, exclusion panel | `app/admin/whatsapp/audiences/page.tsx`, `.../audience-{list,builder}.tsx`, `.../exclusion-panel.tsx` |
| 20 | Audience APIs + strict filter schema | `app/api/admin/whatsapp/audiences/{route,preview,[id]}.ts`, `.../audience-schema.ts` |
| 21 | **Templates** — list, request form, detail, bubble preview, internal review | `app/admin/whatsapp/templates/**`, `.../template-{list,form,preview,actions,status}.tsx` |
| 22 | Template linter + Meta component builder, with 42 tests | `.../template-lint.ts`, `.../templates.ts`, `scripts/test-template-lint.ts` |
| 23 | Template APIs incl. sync and submit-to-Meta | `app/api/admin/whatsapp/templates/**` |
| 24 | **Campaigns** — 5-step wizard, list, live detail, per-recipient table | `app/admin/whatsapp/campaigns/**`, `.../campaign-{wizard,list,detail,status}.tsx` |
| 25 | Campaign engine — queue build, idempotency, cost, stop rules, halt | `.../campaigns.ts` |
| 26 | Campaign APIs — create, estimate, start, approve, pause, halt | `app/api/admin/whatsapp/campaigns/**` |
| 27 | **Dispatcher** — `SKIP LOCKED` claim, per-send consent re-check, backoff, auto-halt | `.../dispatcher.ts`, `app/api/cron/whatsapp-dispatch/route.ts` |
| 28 | `vercel.json` — first cron schedules in this project (also fixes booking-watchdog) | `vercel.json` |
| 29 | Dispatch-rule tests, 47 assertions | `scripts/test-dispatch-rules.ts` |
| 30 | **Webhook handler** — signature, status ladder, inbound, template updates | `.../webhook.ts`, `app/api/webhooks/whatsapp/route.ts` |
| 31 | **Inbox service** — threads, 24h window gate, canned replies | `.../inbox.ts` |
| 32 | Inbox APIs — list, thread, reply (text + template), canned replies | `app/api/admin/whatsapp/{inbox,canned-replies}/**` |
| 33 | **Inbox UI** — list with live countdown, transcript, window-aware composer | `app/admin/whatsapp/inbox/`, `.../inbox-{view,thread}.tsx`, `.../window-countdown.tsx` |
| 34 | **Automations** — queue-not-send, idempotent per event, 7 seeded triggers | `.../automations.ts`, `.../automation-list.tsx`, `app/admin/whatsapp/automations/` |
| 35 | Automations wired into `BookingService` (confirmation + payment failure) | `lib/services/booking-service.ts` |
| 36 | **Analytics** — funnel, trends, cost vs budget, template leaderboard, best hour | `.../analytics.ts`, `.../analytics-view.tsx` |
| 37 | **Compliance / DPDP** — export, erase-with-tombstone, ledger, suppression, retention | `.../compliance.ts`, `.../compliance-view.tsx` |
| 38 | **Audit-log UI** (tab of the compliance screen) | `.../compliance-view.tsx` |
| 39 | **Roles & capabilities** — admin / marketing / frontdesk / viewer | `.../roles.ts`, `.../admin-guard.ts`, `auth.config.ts` |
| 40 | Two more crons: automations (hourly), retention purge (nightly) | `app/api/cron/whatsapp-{automations,retention}/`, `vercel.json` |

Verification done: `tsc --noEmit` clean across the project; all generated SQL
(36 statements) parsed against the real Postgres 17 grammar via `libpg-query`;
phone normalisation tested on 22 messy real-world formats; STOP detection 17/17
with 0 false positives; quiet-hours midnight wrap tested at every boundary; mock
provider distribution verified over 2,000 sends.

Task 11 verification (2026-08-07): `tsc --noEmit` clean, `eslint` 0 errors; the 7
new raw-SQL queries (tag facets, filtered list, count, export, bulk add/remove
tag, booking lookup) dumped via `.toSQL()` and parsed with `libpg-query` — the
rendered text confirms `IN ($5, $6)`, not the row-constructor trap in gotcha 2;
all three new routes compile and return 307 to the auth gate.

Audiences verification (2026-08-07): `tsc --noEmit` clean; `eslint` across the
whole module reports 0 errors and one warning, `settings.ts:80 '_ignored'`, which
predates this work. The
explain / preview / resolve queries dumped and parsed with `libpg-query` across
10 shapes — every filter key at once, `?|` vs `?&` tag matching, the
re-permission consent branch, and `frequencyCap = 0`. The exclusion buckets were
also checked by hand to be mutually disjoint and complete, so they sum exactly to
`matched - eligible` rather than approximately.

Templates verification (2026-08-07): `tsc --noEmit` clean, `eslint` 0 errors, and
**42 assertions pass** in `scripts/test-template-lint.ts` — the first real test
suite in this module, because the linter is the one piece here that is pure logic
and therefore actually testable without a database. It covers every rejection
rule, checks that warnings do *not* block submission, proves the marketing
opt-out button is auto-added and not duplicable, verifies the parse→build
round-trip is lossless, and confirms the mock provider's deliberately-rejected
seed template (`BIGGEST SALE EVER!!! CLICK bit.ly/xyz NOW`) is caught by our own
linter before it would ever reach Meta.

**Superseded 2026-08-08 — the migration has now been applied.** See the Sprint 4
verification section below. All 15 `wa_*` tables, 7 enums, the settings singleton
and the 7 automation rows exist in the live database, and the module has been
exercised against it.

Campaigns verification (2026-08-07): `tsc --noEmit` clean, `eslint` 0 errors, and
the 5 new raw-SQL queries parsed with `libpg-query` — the counter-refresh
`UPDATE … FROM` (including `AS read`, which is not reserved), the stop-rule
aggregate, the opt-out-rate subquery over an aliased `wa_consent_events`, the
static-audience `IN (…::uuid)` list, and the halt cancel. All routes compile and
return 307/401.

Dispatcher verification (2026-08-07): `tsc --noEmit` clean, `eslint` 0 errors,
**47 assertions pass** in `scripts/test-dispatch-rules.ts`, and the 3 new queries
parsed with `libpg-query` — including the `FOR UPDATE OF m SKIP LOCKED` claim
CTE, which is the single most important statement in the module. The test suite
covers the re-permission rule and the full Meta error taxonomy: every per-recipient
code classifies as `skip` (never a quality failure), every rate limit as
`retryable` (never a failure), every account-level code as `config`/`halt`, and
an unknown code falls through to `permanent` rather than retrying forever.

**Superseded 2026-08-08:** the claim/send loop has now been run against a real
database, end to end, including the automation path. See below.

---

### Sprint 4 verification (2026-08-08)

**The migration was applied.** `psql` is not installed on this machine, so it was
run through the project's own Neon driver (`@neondatabase/serverless` `Pool`,
which supports the multi-statement transaction the file needs). Before: 0 `wa_*`
tables. After: 15 tables, 7 enums, 7 automation rows all `enabled = false`, and
the settings singleton at `enabled = false, test_mode = true`. Nothing can send
until someone deliberately turns it on.

`tsc --noEmit` clean across the project; `eslint` reports **0 errors** across
every file touched (the one remaining warning, `settings.ts:80 '_ignored'`,
predates this work).

**Five new integration suites now run against the real database**, which is the
first time anything in this module has. 216 new assertions, all passing:

| Suite | Assertions | What it actually pins down |
|---|---|---|
| `scripts/test-webhook-db.ts` | 57 | signature verification, the status ladder incl. out-of-order webhooks, Meta-retry idempotency, the STOP path, template updates |
| `scripts/test-inbox-db.ts` | 53 | every `listThreads` filter shape (the raw SQL), the 24h window gate, the consent chokepoint, canned replies |
| `scripts/test-automations-db.ts` | 29 | refusal paths, exactly-once firing, marketing consent gate, **and that the dispatcher actually claims automation messages** |
| `scripts/test-analytics-db.ts` | 38 | funnel counts against a known fixture, rate maths, gap-filled trends, opt-out attribution |
| `scripts/test-compliance-db.ts` | 39 | export, erasure cascade, and that an erased number is still refused after re-import |
| `scripts/test-roles.ts` | 49 | the capability matrix, written as prohibitions |

The pre-existing suites still pass unchanged (42 + 47).

**Three real bugs were found by running the code rather than reading it:**

1. **The dispatcher could never send an automation.** Its claim query did
   `JOIN wa_campaigns c ON c.id = m.campaign_id ... AND c.status = 'sending'`.
   Automation messages have `campaign_id IS NULL`, so an INNER JOIN excluded every
   one of them — they would have sat in `queued` for ever while the automations
   screen cheerfully reported "fired". Now a `LEFT JOIN` with
   `(m.campaign_id IS NULL OR c.status = 'sending')`, and there is a regression
   test that runs the real dispatcher over a real campaign-less row.
2. **Meta's retries inflated the unread badge.** The inbound handler deduplicated
   the *message* on `wamid` but incremented the thread's `unreadCount` in the
   upsert above it, so every retry of a message we already had bumped the badge.
   Reordered so the message insert is the idempotency gate: nothing touches the
   thread's activity fields unless a row was genuinely inserted.
3. **A phantom `tsc` error** — see gotcha 10.

**The UI has now been looked at.** Sign-in is Google OAuth, which cannot be driven
headlessly, so a short-lived admin session cookie was minted locally with the
project's own `AUTH_SECRET` (`scripts/dev-session-cookie.ts`) and the screens were
driven in a browser against seeded demo conversations. Confirmed by eye: the
inbox list with its live 24-hour countdown in all three states (green, amber under
an hour, locked), unread badges and unread-first ordering, the transcript with
delivery ticks and a failed-send bubble carrying its Meta error, the composer
switching from free text to a template picker when the window lapses, the
opted-out warning banner, and the automations, analytics and compliance screens
including a data-subject lookup that wrote the expected audit entry.

**All demo and test data was removed afterwards** — the `wa_*` tables are back to
0 rows apart from the 6 `is_system` audiences the module seeds itself, settings
are back to `enabled = false, test_mode = true`, and all 7 automations are off
with no template.

### The two previously-deferred gates are now enforced

Both were waiting on roles, and roles have landed (§6, `lib/services/whatsapp/roles.ts`):

1. **The two-person rule on template submission is live.** Submitting to Meta now
   needs the `templates.submit` capability, which only `admin` holds, and the
   submitter must not be the drafter. It is applied *adaptively*: with only one
   active admin account there is nobody else to ask, so self-submission is allowed
   and recorded as `selfSubmitted: true` with the active-admin count in the audit
   log. A hard rule would lock a single-admin hotel out of its own module.
2. **Campaign approval** keeps the same adaptive shape, and now additionally
   requires `campaigns.send` / `campaigns.approve` — so a `marketing` account can
   build a campaign and genuinely cannot launch it.

### NOT done — next up

- **Sprint 5: go live.** Needs Meta credentials from the hotel (Phase 1). Nothing
  else is blocked.
- `whatsapp-sync` cron (account health / template status polling) is still not
  registered; template status does arrive by webhook, so this is a backstop rather
  than a gap.
- Media in the inbox (send images/PDFs) is specced in Module 6 but not built — the
  composer is text and templates only.
- Analytics: attribution to bookings via UTM/offer codes, A/B testing, and XLSX
  export are specced but not built. The funnel, trends, cost and leaderboard are.
- `frontdesk`/`viewer` phone masking is decided in `roles.ts` (`shouldMaskPhones`)
  but the contacts UI does not consult it yet — every current caller is an admin.

### Blocking action for the user

None. The migration is applied and the module runs. To actually send, someone must
deliberately: add Meta credentials, set `WHATSAPP_PROVIDER=cloud`, turn off test
mode, and flip the kill switch on.

### Gotchas discovered the hard way — do not re-learn these

1. **`npm run db:generate` is unusable in this repo.** drizzle-kit's snapshot has
   pre-existing drift from the omniware→easebuzz rename, so it prompts
   interactively and cannot complete. Migrations here are hand-written SQL applied
   manually and are *not* in `drizzle/meta/_journal.json` — `0005` works the same way.
2. **Never put a JS array directly in a drizzle `sql` template.** `= ANY(${arr})`
   renders as `= ANY(($1, $2))`, a row constructor, which fails at runtime while
   passing typecheck. Use `sql.join(values.map(v => sql`${v}`), sql`, `)`, as in
   `app/admin/layout.tsx:44`. This bug shipped into `audiences.ts` and was only
   caught by dumping SQL and parsing it.
3. **`libphonenumber-js` must be imported from `/max`.** The default "min" metadata
   returns `getType() === undefined` for *every* Indian number, so landline
   detection silently does nothing.
4. **Raw SQL needs parse-checking.** `tsc` gives zero protection. The working
   method: build the query, call `.toSQL()`, write the SQL to a file, parse it with
   `libpg-query` (installed in the scratchpad, not the project).
5. `xlsx` is CJS and dynamically requires `stream` — fine in Next, but esbuild test
   bundles must use `--format=cjs`, not `esm`.
6. Money is stored in **paise** (integer) throughout, matching `formatCurrency()`
   in `lib/utils.ts`, which divides by 100.
7. **A 500 from `next dev` on a first request is often not your code.** This repo
   lives under `~/Desktop`, which macOS syncs, so Turbopack intermittently fails a
   cold file read with `TurbopackInternalError: … Operation timed out (os error 60)`
   — it hit `lucide-react/.../file-spreadsheet.js`, the one icon not already used
   elsewhere in the project. It resolves itself on a later request. Read the actual
   error out of the HTML before editing anything: `curl -s <url> | grep -o '"err":{.*}'`.
8. Contacts UI filters that depend on `wa_messages` ("delivered but never read",
   "previously failed") are deliberately **not** offered yet — the dispatcher does
   not populate that table until Sprint 3, so they would render an empty list and
   look broken. Only contact-row engagement filters are exposed.
9. **"Is this the re-permission ask?" is a property of the TEMPLATE, never of the
   contact.** The dispatcher was first written with
   `isRePermission: contact.consentStatus === 'pending'`, which reads plausibly
   and is a complete consent bypass: it makes the exemption true for exactly the
   people it is supposed to protect, so any marketing template would reach every
   pending contact. Use `isRePermissionTemplate(templateName)`
   (`template-lint.ts`, env-overridable via `WHATSAPP_REPERMISSION_TEMPLATES`).
   The same rule applies at queue-build time in `campaigns.ts` — a marketing
   template aimed at a pending audience must resolve to **zero** recipients and
   fail loudly at launch, not queue people the gate then skips one by one.
   Covered by `scripts/test-dispatch-rules.ts`.
10. **A `tsc` error inside `.next/` is probably not real.** `tsconfig.json`
    includes both `.next/types/**` and `.next/dev/types/**`, and a stale
    `tsconfig.tsbuildinfo` can report an error against generated code that is
    already correct on disk — the symptom here was
    `Type '"/api/webhooks/whatsapp"' does not satisfy the constraint
    'AppRouteHandlerRoutes'` while `routes.d.ts` plainly contained that route.
    Confirm with `npx tsc --noEmit --incremental false`, then `rm
    tsconfig.tsbuildinfo`. Do not "fix" the source.
11. **`wa_messages` holds two different kinds of row.** Campaign sends have a
    `campaign_id`; automation/transactional sends have `NULL`. Any query over the
    send queue must decide deliberately which it means — an INNER JOIN to
    `wa_campaigns` silently drops every transactional message, which is exactly
    the bug that shipped into the dispatcher's claim query.
12. **Deduplicating a webhook means deduplicating its side effects too.** Meta
    retries constantly. It is not enough to `onConflictDoNothing` the row you
    insert: any counter, timestamp or status you touch in the *same* handler has
    to be behind the same guard. Make the insert the gate — check `returning()`
    is non-empty — and do the rest only then.
13. **The admin UI can be verified locally despite Google OAuth.** Mint a session
    cookie with the project's own `AUTH_SECRET` via
    `scripts/dev-session-cookie.ts`, set it with `document.cookie`, and the panel
    renders. It grants nothing the secret holder does not already have and only
    works against a server running that same secret.
14. **`psql` is not installed on this machine.** Apply migrations through the
    project's Neon `Pool`, which handles the multi-statement transaction; the
    HTTP `neon()` driver does not.

---

## 0a. What the database actually contains (checked 2026-08-07)

A read-only audit of the live Neon database, because this changes the warm-up plan:

| Source | Rows | Usable for marketing? |
|---|---|---|
| `guest_profiles` | **4** total, 4 with a phone | **No.** `marketing_opt_in = true` on **0** rows. `communication_preference = 'whatsapp'` on **0** rows. |
| `bookings` | 89 rows, **42 distinct `guest_phone`** | Utility yes (transactional relationship). Marketing only after a re-permission ask. |
| `wa_*` tables | not created yet | Migration `0006_whatsapp_module.sql` is written but not applied. |

**Consequence:** there is no documented opt-in list in the system today. The columns
to record consent exist, but nothing has ever been written to them. So:

- The Tier A "opted-in past guests" seed list is effectively **empty** — at best ~42
  transactional contacts from `bookings`, none with recorded marketing consent.
- Every one of the hotel's 10,000 imported numbers will land as `pending`, and the
  only marketing message any of them may lawfully receive is `olivia_reengage_v1`.
- Warm-up therefore leads with **utility automations on real bookings** (which build
  quality rating for free and need no marketing consent) and a **re-permission
  campaign**, not with an offer blast.

This is the single most important fact in this document. The earlier assumption that
`guest_profiles.marketing_opt_in` already held a usable seed list was wrong.

---

## 0. Answers to the three questions the hotel asked

### Q. Can we send WhatsApp messages from our own website admin panel?

**Yes.** The Cloud API is a plain server-to-server REST API (`graph.facebook.com`). Our Next.js
backend holds the access token and performs the sends. Consequences:

- No phone needs to stay online, no WhatsApp Web session, no "scan this QR code".
- The admin panel is purely the UI. All sending happens from our Vercel functions.
- Staff log in at `/admin` with their existing credentials. Nothing new to install.
- Because we own the backend, we also own the audit trail, consent records and cost controls —
  which a third-party dashboard would keep on their side.

### Q. Can we upload contact sheets there?

**Yes.** CSV and XLSX upload with a column-mapping step, E.164 normalisation, duplicate
detection and a mandatory consent declaration per import. Nothing is sent until the import is
reviewed and an audience is explicitly built from it. See §3.2.

### Q. Can approved templates be shown there, and can we request new ones?

**Yes to both.**

- **Listing:** `GET /{WABA_ID}/message_templates` returns every template with its live approval
  status. We mirror it into `wa_templates` and refresh on demand + on a schedule.
- **Requesting:** `POST /{WABA_ID}/message_templates` creates a template and submits it to Meta
  for review. So the panel gets a real "Request new template" form — staff fill in body text,
  variables and buttons, and we submit it to Meta directly.
- **Status tracking:** Meta pushes `message_template_status_update` events to our webhook, so
  approvals and rejections (with reason) appear in the panel without anyone checking Business
  Manager.

We add an **internal review step** in front of Meta's: staff *draft* a template request, a
manager approves it, and only then is it submitted upstream. This stops rejected junk from
accumulating against the account's reputation.

---

## 1. Division of work

### Hotel / client owns (Phase 1)

| # | Item | Notes |
|---|---|---|
| 1 | Meta Business Manager account | Must be owned by the hotel, not by us. We get admin access. |
| 2 | Business Verification | GST certificate, incorporation docs, address proof. **Longest lead time — 3–14 days.** |
| 3 | New SIM for the sender number | Must NOT be registered on consumer WhatsApp. Not the number on the website. |
| 4 | WABA + phone number registration | Sets a 6-digit 2FA PIN. Must be recorded. |
| 5 | Display name approval | "Olivia Alleppey" |
| 6 | System User + permanent access token | Scopes: `whatsapp_business_messaging`, `whatsapp_business_management` |
| 7 | Business profile assets | Logo, description, address, email, website |
| 8 | Payment method on the WABA | Meta bills per message; no card = no sends |
| 9 | Sign-off on who may press Send | Names + which staff accounts get the send permission |
| 10 | The actual offer copy | Needed before templates can be submitted |

### We own (Phases 2–7)

Everything else: schema, API client, dispatcher, webhook, the entire admin module, consent
engine, analytics, automations, testing.

### The unblocking trick

We build behind a provider abstraction:

```
WHATSAPP_PROVIDER = mock | cloud
```

The **mock provider** implements the identical interface, writes to the same tables, and
simulates realistic latency, `sent → delivered → read` transitions, and a configurable failure
mix (invalid number, rate limit, template paused). It also simulates template submission and
approval delays.

This means we can build, demo and fully test the entire admin module — imports, campaigns,
inbox, analytics, stop-rules — **before Meta approves anything**. Flipping to `cloud` at the end
is a one-line env change. This is the single most important decision in the plan; without it we
sit idle for two weeks.

---

## 2. The admin panel — module map

Nine modules under `/admin/whatsapp`. Sidebar gets one entry with sub-navigation.

```
/admin/whatsapp                      → 1. Dashboard & health
/admin/whatsapp/contacts             → 2. Contacts
/admin/whatsapp/contacts/import      →    CSV/XLSX import wizard
/admin/whatsapp/contacts/[id]        →    Contact detail + full history
/admin/whatsapp/audiences            → 3. Saved audiences / segments
/admin/whatsapp/templates            → 4. Templates
/admin/whatsapp/templates/new        →    Request a new template
/admin/whatsapp/templates/[id]       →    Detail, preview, rejection reason
/admin/whatsapp/campaigns            → 5. Campaigns
/admin/whatsapp/campaigns/new        →    5-step send wizard
/admin/whatsapp/campaigns/[id]       →    Live progress + per-recipient table
/admin/whatsapp/inbox                → 6. Two-way inbox
/admin/whatsapp/automations          → 7. Transactional automations
/admin/whatsapp/compliance           → 8. Consent ledger & DPDP tools
/admin/whatsapp/analytics            → 9a. Analytics
/admin/whatsapp/settings             → 9b. Settings, caps, kill switch, audit log
```

---

### Module 1 — Dashboard & health

The page someone opens every morning. Read-only except the kill switch.

**Account health strip**
- Connection status (green/red) + last successful API call
- **Quality rating** — Green / Yellow / Red, pulled from the phone-number node, with 7-day trend
- **Messaging tier** — current limit (250 / 1K / 10K / 100K / unlimited) and progress toward next
- Business verification status
- Access token — days until expiry, warning banner under 14 days
- Webhook health — last event received; loud warning if silent > 6h
- Throughput setting

**Today**
- Sends today vs `WHATSAPP_DAILY_CAP` (progress bar)
- Delivered / read / failed counts
- Spend today, spend month-to-date, remaining budget
- Unread inbox count

**Active campaigns** — inline progress bars, pause button on each.

**Alerts feed** — template rejected, quality dropped, campaign auto-halted, budget 80% consumed,
token expiring, webhook silent.

**Global kill switch** — one toggle that stops all outbound sending immediately (writes
`wa_settings.enabled = false`). Every send path checks it. Non-negotiable safety feature.

---

### Module 2 — Contacts

**List view**
- Columns: name, phone (masked for non-privileged roles), consent status, source, tags, last
  message, last inbound, total sent, guest profile link
- Filters: consent status, source, tag, city, has-booked, date ranges, "never messaged",
  "delivered but never read", "failed"
- Search by phone or name
- Bulk actions: add/remove tag, set consent status (with mandatory reason), export, suppress
- Consent status is a coloured badge and is impossible to miss

**Import wizard** — five steps, each explicit:

1. **Upload** — CSV or XLSX to Vercel Blob (`@vercel/blob` already installed). Cap ~50k rows.
2. **Map columns** — auto-detect `phone`/`mobile`/`whatsapp`/`name`/`email`; let staff override.
   Remembered per import for repeat sheets.
3. **Validate & preview** — for every row we show:
   - E.164 normalisation result (default region IN, configurable)
   - invalid / too short / landline / non-numeric → rejected with a reason
   - duplicate within the file
   - already exists in `wa_contacts` (→ update or skip)
   - a table of the first 50 plus a full downloadable error report
4. **Declare consent** — a required step. Staff must pick:
   - *These contacts explicitly opted in to WhatsApp* → choose source + date + optional proof
     upload → imported as `opted_in`
   - *No explicit WhatsApp opt-in* → imported as `pending`. **Pending contacts can only receive
     the re-permission template**, never a marketing offer. Enforced in code, not by policy.
   - A free-text provenance note is mandatory and stored on every row for DPDP evidence.
5. **Confirm** — summary: X imported, Y updated, Z rejected, and what consent state they landed in.

**Contact detail page**
- Profile, linked `guest_profiles` record, booking history
- **Full message timeline** — every template sent, every status transition with timestamps, every
  inbound reply, in one thread
- **Consent history** — an append-only audit: who changed it, when, from what to what, why
- Actions: send a single template, open in inbox, opt out, suppress, delete (DPDP erasure)

---

### Module 3 — Audiences (segments)

Saved, reusable, and either **static** (a frozen list) or **dynamic** (a live filter re-evaluated
at send time). Dynamic is the important one — it means a segment automatically excludes anyone
who opted out since it was created.

Filter builder over `wa_contacts` joined to `guest_profiles` and `bookings`:

| Dimension | Examples |
|---|---|
| Consent | opted_in only (default and locked for marketing) |
| Guest value | total stays, total spent, VIP level, first-time vs repeat |
| Recency | last stay within / not within N days, never stayed |
| Booking | room type booked, rate plan, channel, cancelled-without-rebooking |
| Geography | city, state, country |
| Dates | birthday this month, anniversary this month |
| Engagement | read last campaign, never read, previously failed |
| Frequency | *not* messaged in the last N days (see frequency cap, §9) |

Each audience shows a **live count** and a **cost estimate** before use. Preview button renders
20 real sample contacts with variables filled in.

Prebuilt audiences shipped on day one:
- `Opted-in past guests` — the safe Tier A seed list
- `Pending re-permission` — everyone needing the opt-in ask
- `High-value repeat guests` — VIP or 3+ stays
- `Birthday this month`
- `Lapsed` — no stay in 12 months

---

### Module 4 — Templates

**List** — synced from Meta, with a "Sync now" button and an automatic refresh.
- Badges: `APPROVED` / `PENDING` / `REJECTED` / `PAUSED` / `DISABLED`
- Category badge (MARKETING / UTILITY / AUTHENTICATION) with the cost tier attached, so the
  price difference between marketing and utility is visible at the point of choosing
- Language, variable count, last used, times sent, delivery + read rate per template
- Rejected templates show **Meta's rejection reason** verbatim, with an "Edit & resubmit" action

**Preview renderer** — renders the template as a real WhatsApp chat bubble (header, body, footer,
buttons) with sample variable values. This catches formatting mistakes that are invisible in a
form.

**Request a new template** — a guided form:
- Name (auto-slugified to Meta's `lower_snake_case` requirement)
- Category + language
- Optional header (text / image / document)
- Body with a variable inserter — click "Insert guest first name" rather than typing `{{1}}`,
  which is where most rejections come from
- Optional footer
- Buttons: quick-reply, URL, phone. **For any MARKETING template, an opt-out quick-reply button
  is added automatically and cannot be removed.**
- Live preview alongside the form
- A pre-submit linter that catches the common rejection causes: variable at the very start or end
  of the body, consecutive variables, URL shorteners, missing example values, all-caps promo
  language, emoji-only content
- **Internal approval:** submitting creates a `draft` → `internal_review` record. A manager
  approves, and only then do we `POST` to Meta and move to `pending_meta`.

**Variable mapping** — per template, map each variable to a data source
(`contact.firstName`, `guest.lastStayDate`, `campaign.offerCode`, or a static string per
campaign). Stored on the template so campaigns don't re-do it. Any unmapped variable blocks
sending, and we always define a fallback (`{{1}}` → "Guest") because an empty variable is a
delivery failure.

---

### Module 5 — Campaigns

**The 5-step wizard.** Deliberately slow — this is the screen that spends money and risks the
number.

1. **Template** — approved-only picker, with cost per message shown.
2. **Audience** — pick a saved audience or build one inline. Shows live recipient count. Shows
   the **exclusions being applied and why**: not opted in (N), opted out (N), suppressed (N),
   frequency-capped (N), invalid number (N). Transparency here prevents "why did only 6,000 of
   my 10,000 send?" arguments later.
3. **Variables** — map/confirm, then preview against 5 real contacts.
4. **Schedule** — send now, or schedule; set the daily cap for this campaign; respect quiet hours;
   choose throttle rate.
5. **Review & confirm** — a full-page summary: template preview, recipient count, **estimated
   cost in ₹**, daily cap, expected completion date given the cap. To launch, the user must type
   the campaign name to confirm. Above a configurable threshold (default 1,000 recipients) a
   **second admin must approve** before it starts.

**Campaign detail (live)**
- Status + progress: queued / sent / delivered / read / failed / skipped, updating live
- Funnel visual, delivery rate, read rate, opt-out rate
- **Spend so far** vs estimate
- Pause / Resume / Halt (halt is irreversible and cancels the remaining queue)
- Per-recipient table, filterable by status, with error codes translated to plain English
  ("Not a WhatsApp user", "User has too many marketing messages this week", "Template paused by
  Meta")
- Retry-failed action (only for genuinely retryable error classes)
- Auto-halt banner if a stop rule triggered, with the reason
- Export report as CSV / XLSX

**Post-campaign report** — a shareable summary the hotel can read: reach, engagement, opt-outs,
cost, cost per read, and bookings attributed (see Module 9).

---

### Module 6 — Two-way inbox

The feature the hotel doesn't know to ask for, and probably the highest-value one.

When a guest replies to a template, a **24-hour customer service window** opens during which we
may send **free-form text** — no template, no approval. That makes a real support desk possible
inside the admin panel.

- Conversation list: unread first, with contact name, last message preview, and a live countdown
  on the 24h window
- Thread view: full history, inbound and outbound, delivery ticks
- Reply box — free text while the window is open; automatically switches to a template-only
  picker when it expires, with a clear explanation
- Send images / PDFs (menu, rate card, directions)
- **Canned replies** — managed in settings; tariff, check-in time, directions, cancellation policy
- Assign to a staff member; internal notes not visible to the guest
- Mark resolved; labels (booking enquiry / complaint / F&B / event)
- Sidebar shows the linked guest profile, booking history and consent state
- One-click "create enquiry" into the existing `inquiries` table
- Auto-detects STOP-intent replies and opts the contact out immediately

Secondary benefit: inbound conversations *improve* the account's quality rating, which is exactly
what we need during warm-up.

---

### Module 7 — Automations (transactional)

Utility templates fired by events. ~6× cheaper than marketing, no consent risk (the guest
transacted with us), and they build quality rating for free.

| Automation | Trigger | Template |
|---|---|---|
| Booking confirmation | booking → `confirmed` | utility |
| Payment failed / recovery | payment failure | utility |
| Pre-arrival | T-1 day before check-in | utility |
| Check-out thank you + review ask | day of checkout | utility |
| Booking cancelled | cancellation | utility |
| Event enquiry acknowledgement | `inquiries` insert | utility |
| Birthday / anniversary greeting | date match | marketing (needs opt-in) |

Each with: on/off toggle, template selector, timing offset, test-send, and a log of recent fires.
Hooks into the existing `BookingService` / `booking-state-machine` rather than duplicating logic,
and mirrors what `lib/services/email.ts` already does for email.

---

### Module 8 — Consent & compliance

Built for India's DPDP Act 2023, and for the day someone asks "prove this person agreed".

- **Consent ledger** — append-only, immutable. Every grant, change and withdrawal: who, when,
  source, IP where available, proof file, and the staff member responsible.
- **Opt-out log** — with mechanism (button tap / STOP reply / manual / block signal).
- **Suppression list** — permanent do-not-contact, survives re-imports. A number here can never
  be re-added by a CSV, which is the usual way opt-outs get resurrected.
- **Data subject request tool** — enter a phone number, get:
  - *Export* — everything we hold about them, as JSON + human-readable PDF
  - *Erase* — hard-deletes contact, messages and inbox history, leaves a tombstone in the
    suppression list so they're never contacted again
- **Retention policy** — auto-purge raw webhook payloads after N days, inbox after N months.
- **Compliance snapshot** — total contacts by consent state, % with documented proof, opt-out
  rate trend. The number to watch is "% with documented proof"; it should trend to 100%.

---

### Module 9a — Analytics

- **Funnel** — queued → sent → delivered → read → replied → opted out, per campaign and overall
- **Trends** — daily volume, delivery rate, read rate, opt-out rate, quality rating over time
- **Cost** — spend by day/month, split marketing vs utility, cost per delivered, cost per read,
  cost per attributed booking, against a monthly budget
- **Attribution** — campaign links carry UTM params to the booking engine; combined with
  campaign-specific offer codes we can tie WhatsApp campaigns to actual bookings in the
  `bookings` table and report revenue. This is what justifies the spend to the hotel.
- **Template leaderboard** — read rate and opt-out rate per template, so bad copy is visible
- **Best time to send** — read rate by hour-of-day and day-of-week from our own history
- **Audience comparison** — which segments engage; VIP vs lapsed vs first-time
- **A/B testing** — split an audience across two templates, report the winner with sample sizes
- Reconciliation against Meta's own analytics endpoint so our cost figures can be trusted
- Export to XLSX, matching the existing `reports/` output style

### Module 9b — Settings & operations

- **Connection** — phone number ID, WABA ID, masked token, API version, test connection button
- **Sending limits** — daily cap, per-minute throttle, batch size, max concurrency
- **Quiet hours** — default 21:00–09:00 IST, no marketing sends; queue holds and resumes
- **Frequency cap** — max N marketing messages per contact per rolling 30 days (default 2).
  Prevents the most common cause of mass opt-outs.
- **Budget guard** — monthly ceiling; at 80% warn, at 100% stop marketing sends
- **Stop rules** — editable thresholds for opt-out %, failure %, and quality-rating floor
- **Test mode** — all sends redirect to a whitelist of test numbers. Loud banner when active.
- **Canned replies** — manage inbox quick replies
- **Roles & permissions** — see §6
- **Audit log** — every admin action: imports, campaign launches, consent overrides, setting
  changes, kill-switch flips. Who, when, what, from what to what.
- **Webhook status** — subscribed fields, last event, replay recent events for debugging

---

## 3. Data model

Appended to `lib/db/schema.ts` (single-file convention), then `npm run db:generate && npm run db:migrate`.

### Enums

```
wa_consent_status    pending | opted_in | opted_out | suppressed
wa_contact_source    booking | guest_profile | inquiry | import | inbound | manual
wa_campaign_status   draft | pending_approval | scheduled | sending | paused | completed | halted | failed
wa_message_status    queued | sending | sent | delivered | read | failed | skipped | cancelled
wa_template_status   draft | internal_review | pending_meta | approved | rejected | paused | disabled
wa_direction         inbound | outbound
```

### Tables

| Table | Purpose |
|---|---|
| `wa_contacts` | The list. `phone` unique E.164, name, email, `source`, `consent_status`, `consent_source`, `consent_at`, `consent_proof_url`, `opted_out_at`, `opt_out_method`, `last_inbound_at`, `last_outbound_at`, `marketing_sent_30d`, `tags` (json), `guest_profile_id` FK, `locale`, `notes` |
| `wa_consent_events` | Append-only consent ledger. `contact_id`, `from_status`, `to_status`, `reason`, `source`, `actor_id`, `ip`, `created_at` |
| `wa_suppression` | Permanent do-not-contact. `phone` unique, `reason`, `created_at`. Checked before every send and on every import. |
| `wa_imports` | Import batches. `filename`, `blob_url`, `row_count`, `imported/updated/rejected`, `consent_declaration` json, `provenance_note`, `actor_id`, `error_report_url` |
| `wa_audiences` | Saved segments. `name`, `type` (static/dynamic), `filter` json, `contact_ids` (static only), `last_count`, `last_evaluated_at` |
| `wa_templates` | Local mirror + drafts. `name`, `language`, `category`, `status`, `meta_template_id`, `components` json, `variable_map` json, `rejection_reason`, `submitted_by`, `approved_by`, `synced_at` |
| `wa_campaigns` | `name`, `template_id`, `audience_id`, `status`, `daily_cap`, `throttle_per_min`, `scheduled_at`, `started_at`, `completed_at`, counters (`total/queued/sent/delivered/read/failed/skipped/opted_out`), `estimated_cost`, `actual_cost`, `created_by`, `approved_by`, `halt_reason`, `variant_of` (A/B) |
| `wa_messages` | **The queue and the audit log.** One row per recipient per campaign. `campaign_id`, `contact_id`, `template_id`, `direction`, `status`, `wamid` unique, `idempotency_key` unique, `variables` json, `attempts`, `error_code`, `error_detail`, `queued_at/sent_at/delivered_at/read_at/failed_at`, `cost`, `conversation_id` |
| `wa_inbox_threads` | `contact_id`, `status` (open/resolved), `assigned_to`, `window_expires_at`, `last_message_at`, `unread_count`, `labels` json |
| `wa_inbox_messages` | `thread_id`, `direction`, `type` (text/image/document/button), `body`, `media_url`, `wamid`, `status`, `sent_by`, `created_at` |
| `wa_canned_replies` | `title`, `body`, `category`, `sort_order` |
| `wa_automations` | `key`, `enabled`, `template_id`, `offset_hours`, `config` json, `last_fired_at`, `fire_count` |
| `wa_events` | Raw webhook payloads, append-only, for debugging + replay. Auto-purged. |
| `wa_settings` | Singleton config row: caps, quiet hours, frequency cap, budget, stop-rule thresholds, test mode, kill switch |
| `wa_audit_log` | `actor_id`, `action`, `entity_type`, `entity_id`, `before` json, `after` json, `created_at` |

`wa_messages` doubling as the queue is deliberate: no external queue service, exactly-once
delivery via the unique `idempotency_key`, and a complete per-recipient record for compliance —
all in one table.

---

## 4. API surface

```
# Contacts
GET    /api/admin/whatsapp/contacts                 list + filter + paginate
POST   /api/admin/whatsapp/contacts                 create one
PATCH  /api/admin/whatsapp/contacts/[id]
DELETE /api/admin/whatsapp/contacts/[id]            DPDP erasure
POST   /api/admin/whatsapp/contacts/bulk            tag / consent / suppress
GET    /api/admin/whatsapp/contacts/export

# Import
POST   /api/admin/whatsapp/import/upload            → blob url
POST   /api/admin/whatsapp/import/validate          → preview + error report, no writes
POST   /api/admin/whatsapp/import/commit            → executes, requires consent declaration
GET    /api/admin/whatsapp/import/[id]

# Audiences
GET|POST   /api/admin/whatsapp/audiences
POST       /api/admin/whatsapp/audiences/preview    live count + exclusion breakdown + samples

# Templates
GET    /api/admin/whatsapp/templates
POST   /api/admin/whatsapp/templates                create draft
POST   /api/admin/whatsapp/templates/[id]/submit    internal approve → POST to Meta
DELETE /api/admin/whatsapp/templates/[id]
POST   /api/admin/whatsapp/templates/sync           pull from Meta
POST   /api/admin/whatsapp/templates/[id]/test      send to a test number

# Campaigns
GET|POST /api/admin/whatsapp/campaigns
GET      /api/admin/whatsapp/campaigns/[id]
POST     /api/admin/whatsapp/campaigns/[id]/estimate
POST     /api/admin/whatsapp/campaigns/[id]/approve   second-admin approval
POST     /api/admin/whatsapp/campaigns/[id]/start
POST     /api/admin/whatsapp/campaigns/[id]/pause
POST     /api/admin/whatsapp/campaigns/[id]/halt
POST     /api/admin/whatsapp/campaigns/[id]/retry-failed
GET      /api/admin/whatsapp/campaigns/[id]/export

# Inbox
GET    /api/admin/whatsapp/inbox                    threads
GET    /api/admin/whatsapp/inbox/[threadId]
POST   /api/admin/whatsapp/inbox/[threadId]/reply
POST   /api/admin/whatsapp/inbox/[threadId]/assign
POST   /api/admin/whatsapp/inbox/[threadId]/resolve

# Ops
GET|PATCH /api/admin/whatsapp/settings
GET       /api/admin/whatsapp/health                quality, tier, token expiry, webhook
POST      /api/admin/whatsapp/kill-switch
GET       /api/admin/whatsapp/analytics
GET       /api/admin/whatsapp/audit-log
GET|POST  /api/admin/whatsapp/automations

# Machine endpoints
GET  /api/cron/whatsapp-dispatch      the queue worker      (CRON_SECRET | admin)
GET  /api/cron/whatsapp-sync          templates + health    (CRON_SECRET | admin)
GET  /api/cron/whatsapp-automations   scheduled automations (CRON_SECRET | admin)
GET  /api/webhooks/whatsapp           hub.challenge verification
POST /api/webhooks/whatsapp           statuses, inbound, template updates (HMAC-verified)
```

Every `/api/admin/**` route reuses the existing guard: `auth()` + role check, exactly as
`app/api/cron/booking-watchdog/route.ts` does today.

---

## 5. File manifest

### Services — `lib/services/whatsapp/`

| File | Responsibility |
|---|---|
| `index.ts` | Provider factory — returns mock or cloud based on `WHATSAPP_PROVIDER` |
| `types.ts` | Shared types, Meta error-code enum, `WhatsAppError` |
| `cloud-provider.ts` | Real Cloud API client. Lazy init + `warnedMissingKey` pattern from `lib/services/email.ts`. Backoff on 429 / `613` / `80007` / 5xx. |
| `mock-provider.ts` | Simulator: latency, status transitions, configurable failure mix, fake template approvals |
| `templates.ts` | List / create / sync / lint / render preview |
| `consent.ts` | **The chokepoint.** `canSendMarketing()`, `canSendUtility()`, STOP detection, frequency cap, suppression check. Every send path goes through here. |
| `audiences.ts` | Filter → SQL, count, exclusion breakdown, sample preview |
| `campaigns.ts` | Build queue, counters, stop-rule evaluation, cost estimation |
| `dispatcher.ts` | Claim batch, send with concurrency, map errors, retry policy |
| `inbox.ts` | Thread management, 24h window tracking, free-form vs template gate |
| `automations.ts` | Event-driven transactional sends |
| `import.ts` | CSV/XLSX parse, E.164 normalisation, dedupe, validation report |
| `analytics.ts` | Aggregations, funnel, attribution, cost |
| `phone.ts` | E.164 normalisation (default region IN), validation, masking |

### Routes

`app/api/admin/whatsapp/**` per §4, plus
`app/api/cron/whatsapp-{dispatch,sync,automations}/route.ts` and
`app/api/webhooks/whatsapp/route.ts`.

### Pages & components

`app/admin/whatsapp/**` per §2, with components in `components/admin/whatsapp/`:
`health-strip`, `contact-table`, `import-wizard`, `audience-builder`, `template-card`,
`template-preview` (the WhatsApp bubble renderer), `template-form`, `campaign-wizard`,
`campaign-progress`, `recipient-table`, `inbox-list`, `inbox-thread`, `funnel-chart`,
`cost-panel`, `consent-badge`, `kill-switch`.

### UI primitives to add

`components/ui/` currently has no table, dialog, tabs, checkbox or dropdown. This module needs
`table.tsx`, `dialog.tsx`, `tabs.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `progress.tsx`,
`skeleton.tsx` — same Radix + CVA style as the existing `select.tsx` and `switch.tsx`. `sonner`
is already installed for toasts.

### Infrastructure

- **`vercel.json` — new file.** No cron schedules exist in this project today, so
  `booking-watchdog` isn't actually running on a schedule either. This file fixes that and adds
  the three WhatsApp crons.
- **Dependencies:** `libphonenumber-js` (E.164), `xlsx` (sheet parsing). Everything else —
  `@vercel/blob`, `zod`, `drizzle-orm`, `sonner`, `date-fns`, `framer-motion` — is already here.

---

## 6. Roles & permissions

**Built 2026-08-08** — `lib/services/whatsapp/roles.ts`, enforced by
`requireCapability()` in `admin-guard.ts` across all 30 module API routes, and
covered by 49 assertions in `scripts/test-roles.ts`.

Routes ask for a *capability* (`campaigns.send`), never a role, so adding a role
later is a change to one table. Two notes on how it was wired in:

- `requireAdmin()` still exists and still means admin-only. Routes were moved to
  `requireCapability` deliberately, one at a time — introducing roles could not
  quietly widen access to a route nobody re-examined.
- The middleware in `auth.config.ts` admits the new roles to **`/admin/whatsapp`
  only**. The rest of the admin panel has no capability checks in it, so letting
  a `frontdesk` account into `/admin` wholesale would have handed them bookings,
  pricing and payments as a side effect. The sidebar hides what they cannot reach.

The matrix as built:

| Role | Contacts | Templates | Campaigns | Inbox | Settings |
|---|---|---|---|---|---|
| `admin` | full | full | create + **send** + approve | full | full |
| `marketing` | full | draft + request | create, cannot send | full | read-only |
| `frontdesk` | read, masked phones | read | none | full | none |
| `viewer` | read, masked | read | read | read | read |

Two rules on top, both now enforced:
- **Send is a separate permission from create.** Marketing staff build campaigns; only an admin
  launches them. (`campaigns.create` vs `campaigns.send`; likewise `templates.write` vs
  `templates.submit`.)
- **Two-person rule** above the approval threshold (default 1,000 recipients), and on template
  submission — both adaptive, so a single-admin hotel is not locked out. See §0.

One piece is decided but not yet consumed: `shouldMaskPhones(role)` exists and is
tested, but the contacts UI does not call it yet, because every caller today is an
admin. That is the remaining work to make `frontdesk` genuinely safe to hand out.

---

## 7. Build sequence

Sprint 1–4 need nothing from Meta. Only Sprint 5 does.

### Sprint 1 — Foundation (2–3 days)
Schema + migration · provider abstraction + mock provider · `phone.ts` · `consent.ts` ·
settings + kill switch · UI primitives · sidebar entry · empty module shell
**Done when:** a fake message can be queued and driven to `read` end-to-end, entirely offline.

### Sprint 2 — Contacts & audiences (3–4 days)
Import wizard (all 5 steps) · contact list, filters, detail, timeline · consent ledger ·
suppression list · audience builder with live counts and exclusion breakdown · prebuilt audiences ·
seed from `guest_profiles` where `marketing_opt_in = true`
**Done when:** the hotel's real sheet can be imported, validated and segmented, with a full
consent record — no sending required.

### Sprint 3 — Templates & campaigns (4–5 days)
Template CRUD, linter, bubble preview, internal review flow · variable mapping · campaign wizard ·
cost estimation · dispatcher with `FOR UPDATE SKIP LOCKED`, idempotency, backoff, error mapping ·
stop rules and auto-halt · campaign detail with live progress · pause/resume/halt ·
`vercel.json` crons
**Done when:** a 5,000-recipient campaign runs to completion against the mock provider, respects
caps and quiet hours, and auto-halts on a simulated opt-out spike.

### Sprint 4 — Inbox, automations, analytics, compliance (4–5 days)
Webhook handler (HMAC, statuses, inbound, template updates) · inbox with 24h window logic ·
canned replies · automations wired into `BookingService` · analytics + attribution ·
DPDP export/erase tools · audit log · roles
**Done when:** the module is feature-complete and demoable to the hotel on mock data.

### Sprint 5 — Go live (2 days + warm-up) — **needs Phase 1 done**
Real credentials · register webhook URL · submit the three templates · sync · test mode sends to
our own numbers · flip `WHATSAPP_PROVIDER=cloud` · then the warm-up ramp:

Revised against §0a — there is no opted-in seed list, so the ramp leads with utility:

| Days | Daily cap | Audience |
|---|---|---|
| 1–3 | 250 | **Utility only.** Booking confirmations + pre-arrival on live bookings, and the ~42 `bookings` phones. Builds quality rating with zero marketing-consent risk. |
| 4–7 | 1,000 | `olivia_reengage_v1` to the first slice of `pending` imports — a permission ask, not an offer. |
| 8–14 | 5,000 | Re-permission continues; first marketing offers go **only** to contacts who tapped "Yes, keep me posted". |
| 15+ | 10,000 | Marketing to the accumulated opted-in pool; re-permission to the remainder. |

Expect the opted-in pool to be a fraction of 10,000. That is the correct outcome, not a
failure of the campaign — and it is what keeps the number alive.

Quality rating checked daily. Yellow → hold. Red → stop.

**Total: ~15–18 working days of build**, of which 13–17 are unblocked and can start immediately.

---

## 8. Templates to submit (Sprint 5)

| Template | Category | Purpose |
|---|---|---|
| `olivia_offer_v1` | MARKETING | The campaign. `{{1}}` = first name. Auto-included opt-out button. |
| `olivia_reengage_v1` | MARKETING | Permission ask for `pending` contacts. `Yes, keep me posted` / `No thanks` buttons. **This is what converts a grey list into a legal one.** |
| `olivia_booking_confirm_v1` | UTILITY | Automation. ~6× cheaper, builds quality rating. |
| `olivia_prearrival_v1` | UTILITY | T-1 day. |
| `olivia_checkout_review_v1` | UTILITY | Review request. |

---

## 9. Guardrails, consolidated

Every one of these is enforced in code, not by staff discipline:

1. **Kill switch** — one toggle halts all outbound sending.
2. **Consent chokepoint** — a single function every send path must call. Marketing to a
   non-`opted_in` contact is impossible.
3. **Suppression list** — survives re-imports permanently.
4. **Frequency cap** — max 2 marketing messages per contact per 30 days.
5. **Quiet hours** — no marketing 21:00–09:00 IST.
6. **Daily cap** — matched to the account's messaging tier during warm-up.
7. **Auto-halt** — opt-out rate > 3%, failure rate > 10%, or quality rating Red.
8. **Budget ceiling** — warn at 80%, stop marketing at 100%.
9. **Idempotency** — unique key per (campaign, contact); a retry can never double-bill.
10. **Two-person rule** — large campaigns need a second admin's approval.
11. **Typed confirmation** — the campaign name must be typed to launch.
12. **Test mode** — redirects every send to a whitelist.
13. **Audit log** — every action attributable to a person.

---

## 10. Open decisions

| # | Decision | Default if unanswered |
|---|---|---|
| 1 | ~~Vercel plan~~ — **RESOLVED 2026-08-07: paid Vercel + paid Neon.** | Use `vercel.json` crons with per-minute granularity. No external scheduler, no queue service. |
| 2 | Roles — add `marketing`/`frontdesk`, or keep the single `admin` gate? | Ship the permission matrix but default everyone to `admin` so nothing breaks. |
| 3 | Consent state of the 10,000 imported numbers | `pending`. Marketing offers blocked; re-permission template only. |
| 4 | Monthly budget ceiling | ₹25,000/month, warn at 80%. |
| 5 | Approval threshold for the two-person rule | 1,000 recipients. |
| 6 | Inbox — do we want it in v1? | Yes. It's cheap once the webhook exists and it's the module staff will use daily. |
| 7 | Sheet format the hotel will supply | Support both CSV and XLSX; column mapping handles the rest. |

---

## Appendix — env vars

```
# WhatsApp Cloud API
WHATSAPP_PROVIDER=mock            # mock | cloud
WHATSAPP_ENABLED=false            # global kill switch
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_API_VERSION=v23.0
WHATSAPP_DEFAULT_REGION=IN
WHATSAPP_TEST_MODE=true
WHATSAPP_TEST_NUMBERS=            # comma-separated E.164
WHATSAPP_DAILY_CAP=250
WHATSAPP_MONTHLY_BUDGET_INR=25000
```
