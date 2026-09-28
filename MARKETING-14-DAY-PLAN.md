# Olivia Alleppey — Digital Marketing Setup: 14-Day Plan

**Owner:** John Solomon (Lead Developer & Solution Architect)
**Client:** Olivia Alleppey — marcomm@oliviaalleppey.com (cc: VP, Finance)
**Engagement start:** 2026-08-01 · **Setup window:** Day 1–14 (Aug 1 – Aug 14, 2026)
**Effort budget:** 2 hrs/day × 14 = 28 hrs
**Retainer:** ⚠️ CONFIRM — proposal states ₹20,000/month; verbally referenced as ₹12,000. Pin this in writing before Day 3.
**Minimum engagement:** 2 months · **Payable:** by 4th of each month

> **How to use this file:** update the checkboxes as you go, log dates in the client-blockers table, and record every decision in the Decision Log. This is the single source of truth for the engagement — if it isn't in here, it didn't happen.

---

## 1. Scope Boundary — protect this

### ✅ IN SCOPE (covered by the retainer)

| # | Area | Deliverables |
|---|------|-------------|
| 1 | **SEO & Google Business Profile** | Technical audit + fixes, on-page optimisation, local keyword targeting, weekly GBP posts + photos, review management, monthly ranking & traffic reports |
| 2 | **WhatsApp Marketing** | Business API setup + verification, message templates, guest DB segmentation, 2–4 broadcasts/month, automated replies, click-to-WhatsApp flow on site |
| 3 | **Email Marketing** | Platform setup with domain authentication, list segmentation, 2 designed campaigns/month |

### ❌ OUT OF SCOPE (quote separately — do not absorb)

- **Paid ads management** (Meta / Google / Instagram) — proposal already says ad budget is a separate top-up with management charged separately
- **Instagram follower growth & awareness campaigns** — client requested this after approval. Organic content support can be folded in as goodwill; **anything paid or any content production beyond light support must be quoted.**
- **Photo/video shoots** — creative team time is a separate line
- **Website redesign / new feature development**

> ⚠️ **Client asked for "awareness + more Instagram followers" after signing.** This is the most likely source of scope creep in this engagement. Decide and state in writing: what you'll do free vs. what's billable. Realistic expectation to set — organic posting alone rarely moves follower count meaningfully in 2 weeks; it needs paid boost or creator collabs.

### 💰 Platform costs — CLIENT PAYS AT ACTUALS (no margin)

| Item | Est. cost | Whose card | Status |
|------|-----------|-----------|--------|
| WhatsApp API subscription | ₹1,000–2,500/mo | **Client** | ☐ Not yet set up |
| WhatsApp message credits | ₹1.10/msg + 18% GST = **₹1.30/msg** | **Client** | ☐ Not funded |
| Email platform | Free initially → ₹2,000–3,500/mo at 30k sends | **Client** | ☐ Not yet set up |
| Email list validation (one-off, 15k) | ~₹2,000–3,000 | **Client** | ☐ Not yet run |
| SEO tools (optional) | ₹1,500–3,000/mo | **Client** | ☐ Optional |

### 🚨 The proposal's ₹5,000–8,000/month estimate is ~5x too low

That figure assumed ~3,000 messages/month. With a real guest database it scales linearly:

| Guest DB | Per broadcast | 2/month | 4/month |
|---|---|---|---|
| 3,000 | ₹3,900 | ₹7,800 | ₹15,600 |
| 5,000 | ₹6,500 | ₹13,000 | ₹26,000 |
| **10,000** | **₹13,000** | **₹26,000** | **₹52,000** |
| 15,000 | ₹19,500 | ₹39,000 | ₹78,000 |

At a 10k database and 4 broadcasts/month, true platform cost is ≈ **₹56,000/month, not ₹8,000.**

**This is a credibility risk, not a budget risk** — a 5-star property can absorb it, but the figure was quoted in writing and the first invoice cannot be 6x it.

**Handling sequence (do not skip):**
1. Get the **exact contact count** as part of onboarding (B5/B6)
2. Calculate the real monthly figure from the table above
3. Send it for written approval **BEFORE broadcast #1** — framed as "here's what reaching your database costs"
4. Log actuals in §12 monthly so reimbursement is never disputed

> Presented up front, this is competence. Discovered after the fact, it's an argument.

---

## 2. Current State

### ✅ Already done (as of Day 0)

- [x] Proposal sent and approved by client
- [x] **DNS audit completed** — findings below (see §3)
- [x] Confirmed access held: website, hosting/CMS, **domain + DNS**, brand kit
- [x] Confirmed client already runs **Meta Ads Manager** and **Google Ads** → their Business Manager is likely already verified, and GBP is likely already claimed. This removes the biggest expected blocker (GST/registration doc chase). **Verify, don't assume.**
- [x] Creative team available for content production

### 🔑 Access I already hold — no client dependency

| Asset | Status | Unblocks |
|-------|--------|----------|
| Website / CMS / hosting | ✅ Held | All on-page SEO, click-to-WhatsApp flow, signup forms |
| Domain registrar + DNS | ✅ Held | SPF, DKIM (record side), DMARC, Search Console, subdomain |
| Brand kit (logo, colours, fonts) | ✅ Held | Email templates, WhatsApp profile, GBP posts |

---

## 3. 🚨 Critical Finding — Domain has ZERO email authentication

DNS audit of `oliviaalleppey.com` run 2026-08-01:

| Record | Current state | Impact |
|--------|--------------|--------|
| MX | Google Workspace ✅ | Business mail runs on Gmail |
| **SPF** | **MISSING** ❌ | Unauthenticated mail — hurts deliverability today |
| **DKIM** | **NOT ENABLED** ❌ | No `google._domainkey` record found |
| **DMARC** | **MISSING** ❌ | No policy, no visibility |

### Why this is the most important item in this plan

1. **Google/Yahoo bulk sender rules (Feb 2024):** anyone sending **5,000+/day** MUST have SPF + DKIM + DMARC, one-click unsubscribe, and spam complaints under 0.3%. At 15k contacts you cross that threshold — **without these, mail is rejected outright, not just filtered.**
2. **Domain age ≠ sending reputation.** The domain is years old (good — avoids the "registered last week" flag) but has **never sent bulk email and isn't authenticated**, so it has no positive sending reputation to trade on. Warm-up is still mandatory, just shorter.
3. **Immediate client-visible win:** their existing business mail from `marcomm@` is currently unauthenticated and under-delivering. Fixing this costs you 30 minutes and is demonstrable value in week 1 — lead the first status update with it.

### Records to publish

**SPF (root domain)** — ⚠️ confirm what else sends as the domain first (old agency, booking engine, PMS) and add their includes:
```
v=spf1 include:_spf.google.com ~all
```

**DMARC — start soft, never open at p=reject:**
```
v=DMARC1; p=none; rua=mailto:dmarc@oliviaalleppey.com
```
Monitor reports 2–3 weeks → then tighten to `p=quarantine` → later `p=reject`.
**Note:** DMARC policy is *inherited by subdomains*, so this also governs the marketing subdomain.

**DKIM** — ⚠️ **BLOCKED ON CLIENT.** Google Workspace DKIM is off by default. The key is generated in
`Google Admin console → Apps → Google Workspace → Gmail → Authenticate email`, then published in DNS.
Requires **Google Workspace super-admin access** — this is separate from website/domain access and must be requested.

**Marketing subdomain:** `news.oliviaalleppey.com` — own SPF/DKIM via the ESP.
Rationale: isolates campaign reputation so a bad send never damages booking confirmations and enquiry replies on the root domain.

---

## 4. 🔴 Blocked on Client — chase register

Update the dates. Anything sitting >3 days, escalate to the VP, not marcomm.

| # | Item | Owner (their side) | Requested | Received | Blocks |
|---|------|-------------------|-----------|----------|--------|
| B1 | **Meta Business Manager** — partner/admin access + confirm it's already verified | Marketing | ☐ | ☐ | ALL WhatsApp |
| B2 | **WhatsApp number** — dedicated, NOT active on any WhatsApp app | Admin | ☐ | ☐ | ALL WhatsApp |
| B3 | **Google Business Profile** — Manager access + confirm claimed/verified | Marketing | ☐ | ☐ | GBP posts, reviews, local SEO |
| B4 | **Google Workspace super-admin** — to enable DKIM | IT / Admin | ☐ | ☐ | Email auth, all sends |
| B5 | **Guest phone list** + how collected (consent) | Front desk / Reservations | ☐ | ☐ | WhatsApp segmentation + broadcasts |
| B6 | **Email list (~15k)** + how collected (consent) | Front desk / Reservations | ☐ | ☐ | All email campaigns |
| B7 | **Card on BSP** for API subscription + message credits | Finance | ☐ | ☐ | WhatsApp broadcasts |
| B8 | **Exact registered business address** | Admin | ☐ | ☐ | Email footer (legally required) |
| B9 | **Official NAP** + top packages to rank for + real competitors | Marketing | ☐ | ☐ | Local SEO, GBP |
| B10 | **Property photos/videos** (rooms, food, houseboat, exterior) | Marketing | ☐ | ☐ | GBP posts, emails, reels |
| B11 | **Single approver** + turnaround expectation | — | ☐ | ☐ | All content sign-off |
| B12 | **Written ack:** platform costs are theirs at actuals | Finance | ☐ | ☐ | Billing clarity |
| B13 | **What else sends as the domain?** (old agency, booking engine, PMS) | IT | ☐ | ☐ | Correct SPF record |
| B14 | **Instagram + Facebook Page access** (if IG track proceeds) | Marketing | ☐ | ☐ | IG/awareness work |
| B15 | **FAQs / booking process / current offers** | Reservations | ☐ | ☐ | WhatsApp templates + auto-replies |

### ⚖️ Consent — the question that governs both channels

For **B5** and **B6**, the answer determines whether this is safe to run at all:

- **Past guests who booked/stayed** → defensible, and they'll actually engage
- **Bought / scraped / harvested list** → fast WhatsApp ban, email blacklisting, and a genuine problem under **India's DPDP Act 2023** (plus GDPR if any guests are EU/UK)

Also ask: **when were these last contacted?** A 15k list never emailed in 3 years is functionally a cold list even if every address was opt-in originally.

**Do not send to a list you can't account for.** Get the provenance answer in writing and file it here.

---

## 5. Dependency Map — what unlocks what

```
CLIENT INPUTS                    MY WORK                         OUTPUT
─────────────                    ───────                         ──────

[DNS access ✅] ──────────────► SPF + DMARC published ──┐
                                                        │
[B4 Workspace admin] ─────────► DKIM enabled ───────────┼──► Auth live
                                                        │    (+48h settle)
                                                        │         │
[B13 who else sends] ─────────► Correct SPF ────────────┘         │
                                                                  ▼
[B6 email list] ──────────────► Validate → segment ──────► WARM-UP RAMP ──► Full 15k
[B8 address] ─────────────────► Compliant footer ────────►      │           (~Day 15+)
[Brand kit ✅] ───────────────► Master template ─────────►      │
                                                          Campaign #1
                                                                  
[B1 Meta BM] ──┐
[B2 number] ───┼─────────────► WhatsApp API live ──► Templates submitted ──┐
[B7 card] ─────┘                                     (Meta approval 1-24h) │
                                                                            ▼
[B5 guest list] ─────────────► Clean + segment ─────────────────► BROADCAST #1
[B15 FAQs/offers] ───────────► Template copy + auto-replies ────►  (ramped)
[B2 number] ─────────────────► Click-to-WhatsApp on site ──────► GA4 tracked

[B3 GBP Manager] ────────────► Listing optimised ──────► Weekly posts + review replies
[B9 NAP/keywords] ───────────► Local keyword map ──────► On-page + GBP alignment
[B10 photos] ────────────────► Post/email/reel assets

[Website ✅] ────────────────► Tech audit → fixes → schema → GSC/GA4  (NO DEPENDENCY)
```

### Hard rules

1. **No email send before auth is live + 48h settled.**
2. **No email send before the list is validated.** Hard bounces >2–3% and your ESP suspends *you*.
3. **No WhatsApp broadcast before written spend sign-off.**
4. **Ramp advances on metrics, not the calendar** (see §7).
5. **The independent track (SEO/website/templates/content) never waits on the client** — if blocked, pull that work forward rather than idling.

---

## 6. Day-by-Day Plan (2 hrs/day)

### 🟩 Day 1 — Aug 1 · Start every external clock
*No client dependency. Highest-leverage day.*

- [ ] **(45m)** Send the onboarding email — all items in §4. Flag B1–B4 as urgent. Route by department (Finance / Marketing / Admin / Reservations) so it doesn't sit with one person.
- [ ] **(30m)** Publish **SPF** + **DMARC (p=none)** on root domain. ← *starts the 48h settle clock*
- [ ] **(20m)** Set up secure credential vault (password manager share). **Never accept logins over WhatsApp/email.**
- [ ] **(25m)** Create accounts: email platform (Brevo), WhatsApp BSP shortlist (AiSensy / Interakt / WATI / Gupshup)

**Fallback if blocked:** nothing here is blocked.

---

### 🟩 Day 2 — Aug 2 · Measurement baseline
*No client dependency — you hold DNS + website.*

- [ ] **(30m)** Verify **Google Search Console** (DNS method), submit sitemap, check index coverage
- [ ] **(30m)** Install **GA4**; define conversions: WhatsApp clicks, call clicks, enquiry submits, booking clicks
- [ ] **(30m)** Set up **Google Postmaster Tools** — needs DNS. Critical: most of a Kerala hotel list is Gmail, and this is your only real view of domain reputation during warm-up.
- [ ] **(30m)** Blacklist check the root domain — Spamhaus, MXToolbox, Talos. Old domains occasionally carry someone else's history.

**Record baselines here** (you cannot show growth without them):

| Metric | Day 2 baseline | Day 14 |
|--------|---------------|--------|
| Organic sessions (30d) | | |
| Ranking keywords | | |
| GBP views / calls / direction requests | | |
| Instagram followers | | |
| Email list size (validated) | | |

---

### 🟩 Day 3 — Aug 3 · SEO technical audit
- [ ] **(75m)** Full crawl: Lighthouse/PageSpeed, Core Web Vitals, mobile usability, indexing, broken links, redirect chains, duplicate titles/metas. Log every issue by priority.
- [ ] **(30m)** Verify auth records propagated correctly (SPF/DMARC lookup)
- [ ] **(15m)** **Chase any of B1–B4 not yet received.** Day 3 is the escalation trigger.

---

### 🟩 Day 4 — Aug 4 · SEO fixes shipped
- [ ] **(75m)** Ship priority fixes: title tags, meta descriptions, canonicals, robots.txt, sitemap, **LocalBusiness + Hotel schema**, image alt text, speed wins
- [ ] **(45m)** Enable **DKIM** if B4 (Workspace admin) has arrived → publish selector in DNS

**Fallback if B4 not in:** spend the 45m on image compression + lazy-load, and escalate B4 — it blocks everything email.

---

### 🟩 Day 5 — Aug 5 · Local keywords + on-page
- [ ] **(60m)** Local keyword research — Alleppey houseboat/backwater/resort terms, competitor gap analysis. Map keywords → pages.
- [ ] **(60m)** On-page: rewrite titles/H1s, add local intent copy, FAQ section, internal linking

**Needs (soft):** B9. If not in, use your own competitor read and confirm with them later.

---

### 🟨 Day 6 — Aug 6 · Email infrastructure complete
- [ ] **(45m)** Set up `news.oliviaalleppey.com` in Brevo — publish its SPF + DKIM
- [ ] **(45m)** Build branded master email template from brand kit (mobile-first)
- [ ] **(30m)** Footer compliance: physical address (**B8**), one-click unsubscribe, preference link
- [ ] Verify auth passes end-to-end (mail-tester.com — target 9/10+)

**Blocked by:** B4 (DKIM), B8 (address)

---

### 🟨 Day 7 — Aug 7 · List validation + segmentation
- [ ] **(45m)** Run all 15k through validation (ZeroBounce / NeverBounce / Bouncer). **Expect 20–30% dead on an old hotel list.**
- [ ] **(45m)** Segment by recency: `0–12mo` → `12–24mo` → `24mo+`. Suppress invalid + role addresses (info@, admin@).
- [ ] **(30m)** Same treatment for the guest phone list — clean, dedupe, format to E.164, segment

**Blocked by:** B5, B6

**Fallback:** design Campaign #1 and draft WhatsApp template copy instead.

---

### 🟨 Day 8 — Aug 8 · WhatsApp API live
- [ ] **(45m)** BSP account → connect number → register under **their** Business Manager → display name + profile photo + business description
- [ ] **(45m)** Submit message templates for Meta approval: welcome, enquiry acknowledgement, booking info, offer broadcast. *(Approval 1–24h — submit early in your session.)*
- [ ] **(30m)** Confirm client's card is on the BSP and credits are loaded (**B7**)

**Blocked by:** B1, B2, B7
**If their BM is already verified** (likely — they run Meta ads), this is hours not days. Confirm on Day 1.

---

### 🟧 Day 9 — Aug 9 · Campaign #1 + FIRST WARM-UP SEND
- [ ] **(60m)** Design Campaign #1 — re-engagement, not a hard sell. *"Alleppey in season / what's new at Olivia"* + one clear offer. Warm, useful, one CTA.
- [ ] **(30m)** Seed test → check inbox placement across Gmail/Outlook/Yahoo, verify auth passes
- [ ] **(30m)** 🚀 **Send #1: 400–500 to the most recent guests only**

**Gate before sending:** auth live + 48h settled ✅ · list validated ✅ · footer compliant ✅

---

### 🟨 Day 10 — Aug 10 · Google Business Profile
- [ ] **(60m)** Optimise listing: categories, services, description, hours, attributes, NAP consistency, booking link, photo upload
- [ ] **(45m)** Create + schedule first 4 weekly posts + photo sets
- [ ] **(15m)** **Check Send #1 metrics** — log in §7. Do not advance the ramp if gates fail.

**Blocked by:** B3, B10
**Fallback:** produce all post content ready to drop in, and escalate B3.

---

### 🟩 Day 11 — Aug 11 · Click-to-WhatsApp + automation
- [ ] **(60m)** Build and ship click-to-WhatsApp on the site — floating button, pre-filled message, tracked as a GA4 event. Test on mobile.
- [ ] **(45m)** Configure automated replies: greeting, away message, keyword/FAQ auto-responses, business hours
- [ ] **(15m)** 🚀 **Send #2: ~1,500** (if Day 9 gates passed)

**Needs:** B2 (number), B15 (FAQs)

---

### 🟧 Day 12 — Aug 12 · First WhatsApp broadcast + Instagram track
- [ ] **(30m)** ✍️ **Get written spend sign-off** for the broadcast — quote the exact credit cost
- [ ] **(30m)** 🚀 **Broadcast #1: 200–300 to most recent guests only.** Include `Reply STOP to unsubscribe` and honour it. Watch quality rating before anything larger.
- [ ] **(60m)** Instagram track: connect IG to Business Suite, audit the account, brief the creative team, lock a **Reels-led** 2-week content calendar

**Blocked by:** B7 (funding), templates approved, B14 (IG access)

---

### 🟩 Day 13 — Aug 13 · Monitor, ramp, build Campaign #2
- [ ] **(30m)** Full metrics review — email deliverability, WhatsApp quality rating, GA4 events, GSC coverage
- [ ] **(30m)** 🚀 **Send #3: ~3,000** (12–24mo segment) *if gates pass*
- [ ] **(45m)** Design Campaign #2 (keep as draft — schedules into month 2)
- [ ] **(15m)** Escalate anything still outstanding in §4

---

### 🟦 Day 14 — Aug 14 · QA, report, handover
- [ ] **(45m)** **End-to-end QA:** click-to-WhatsApp flow live · auto-replies firing · email auth passing · GBP live and posting · GA4 events recording · all SEO fixes verified live
- [ ] **(45m)** Build the **monthly report dashboard**: rankings, organic traffic, GBP insights, WhatsApp delivery/read rates, email open/click, IG baseline
- [ ] **(30m)** Send client the **Month 1 setup report**: what's live, what's pending on their side (name the blockers and the dates you requested them), what runs in month 2, and the platform costs incurred at actuals

> **Colour key:** 🟩 no client dependency · 🟨 blocked on client input · 🟧 needs spend/approval · 🟦 delivery

---

## 7. Ramp Gates — advance on metrics, not the calendar

### 📧 Email warm-up ladder

Domain is old (helps) but has **no sending history** (doesn't help), so ~2–2.5 weeks instead of 4.

| Stage | Volume/day | Segment | Sent | Date |
|-------|-----------|---------|------|------|
| 1 (Day 9–10) | 400–500 | Most recent guests | ☐ | |
| 2 (Day 11–12) | ~1,500 | Last 12 months | ☐ | |
| 3 (Day 13–14) | 3,000–4,000 | 12–24 months | ☐ | |
| 4 (Day 15+) | Full | Remainder | ☐ | |

### 🚦 Gates — ALL must pass before advancing

| Metric | Green — advance | Amber — hold | Red — STOP |
|--------|----------------|-------------|-----------|
| Hard bounce | <2% | 2–3% | >3% *(ESP suspends you)* |
| Spam complaints | <0.1% | 0.1–0.3% | >0.3% *(Google hard limit)* |
| Open rate | >20% | 10–20% | <10% *(stop mailing that segment)* |
| Unsubscribes | <0.5% | 0.5–1% | >1% |

**If a segment goes red, stop mailing that segment permanently.** Dragging a dead cohort along damages the domain for everyone else.

### 📱 WhatsApp ramp

Messaging limits are tiered — a verified business typically starts around **1,000 unique recipients/24h**, scaling to 10k → 100k with consistent good-quality sending. "Blast everyone" is not mechanically possible at first.

| Stage | Volume | Segment | Sent | Quality rating after |
|-------|--------|---------|------|---------------------|
| 1 | 200–300 | Most recent guests | ☐ | |
| 2 | ~500 | Last 12 months | ☐ | |
| 3 | ~1,000 | Broader | ☐ | |
| 4 | Tier max | Full | ☐ | |

**Quality rating is what kills numbers.** Blocks and reports drop the rating → limits get cut → number restricted or banned. Marketing templates draw the most blocks.

- ✅ Always include an opt-out line and honour it — this single line protects the number more than anything else
- ✅ Check quality rating in the BSP dashboard **after every send**
- 🛑 If rating drops to **Medium** — pause and review copy/targeting. **Red** — stop entirely.

---

## 8. Monitoring — what to check and when

### Daily (5 min, during ramp)
- [ ] Email: bounce %, complaint %, open rate on the last send
- [ ] WhatsApp: quality rating + delivery/read rates
- [ ] Any client replies unblocking §4

### Weekly
- [ ] Google Postmaster Tools — domain reputation trend
- [ ] Search Console — coverage errors, impressions, position changes
- [ ] GBP insights — views, calls, direction requests
- [ ] GA4 — WhatsApp click events, enquiry conversions
- [ ] DMARC aggregate reports — anything sending as the domain that shouldn't be
- [ ] Publish 1 GBP post + respond to all new reviews

### Monthly (client-facing report)
- [ ] Ranking movement on target keywords
- [ ] Organic traffic vs. previous month
- [ ] GBP performance
- [ ] WhatsApp: sent / delivered / read / replied, cost at actuals
- [ ] Email: sent / open / click / unsubscribe
- [ ] Enquiries and bookings attributable to each channel
- [ ] Platform costs incurred (for their reimbursement)

---

## 9. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | Client sends a bought/scraped list | Medium | **Severe** — bans, blacklisting, DPDP exposure | Get provenance in writing before any send. Refuse unaccountable lists. |
| R2 | Client pressures for the full 15k blast immediately | **High** | Severe — domain burned | Expectation set now: 2–3 weeks to full volume. Frame as protecting their domain + number. |
| R3 | B4 (Workspace admin) never arrives | Medium | High — no DKIM, no email at all | Escalate to VP by Day 4. Everything email stalls without it. |
| R4 | Instagram/awareness scope creep | **High** | Medium — unpaid work | Written in/out boundary (§1). Quote paid work separately. |
| R5 | WhatsApp number banned | Low–Medium | High — restart from zero | Ramp slowly, opt-out honoured, monitor quality after every send |
| R6 | Old list has spam traps | Medium | High — blacklisting | Validation on Day 7 is non-negotiable |
| R7 | Fee ambiguity (₹20k vs ₹12k) | Medium | Medium — billing dispute | Confirm in writing before Day 3 |
| R10 | **Quoted platform cost ₹5–8k vs actual ~₹56k** | **High** | **High — credibility** | Get contact counts at onboarding; send real figure for approval BEFORE broadcast #1, never after |
| R8 | Client slow on content approval | High | Medium — delays campaigns | Single approver + agreed turnaround (B11) |
| R9 | Unknown third party sending as domain | Medium | Medium — SPF breaks their mail | B13 before finalising SPF; DMARC p=none first |

---

## 10. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-01 | Marketing email sends from `news.oliviaalleppey.com`, not root | Isolates campaign reputation; protects booking confirmations and enquiry replies |
| 2026-08-01 | DMARC opens at `p=none` | Going straight to reject would break their existing Workspace mail |
| 2026-08-01 | Warm-up ~2–2.5 weeks, not 4 | Domain age removes the new-domain penalty, but zero sending history means ramp is still required |
| 2026-08-01 | Validate the full 15k before any send | ESP suspends at >2–3% hard bounce; old hotel lists run 20–30% dead |
| 2026-08-01 | WhatsApp starts at 200–300 to recent guests | Quality rating protection — marketing templates draw the most blocks |
| 2026-08-01 | **Do NOT reopen the signed retainer** | Renegotiating within 2 weeks of signing reads as mispricing or opportunism. If underpriced, recover margin on the new out-of-scope work instead. |
| 2026-08-01 | **Quote Instagram/ads around Day 8–10, not at onboarding** | New money alongside "send me your documents" undercuts both. Deliver the email-auth fix + SEO audit first, then quote off proven competence. |
| | | |

### 💡 Upsell path — Instagram & ads (the legitimate margin)

Client requested awareness + IG follower growth **after** signing. Genuinely out of scope, and the proposal already states ads management is quoted separately.

| Item | Indicative | Notes |
|------|-----------|-------|
| IG content + management | ₹25,000–40,000/mo | Creative team runs production; Reels-led |
| Ads management | 15% of spend, ₹15,000/mo floor | Ad budget separate on top |

**Sequence:** week 1 deliver the email-auth finding + SEO audit → Day 8–10 present IG proposal → anchor against what they're currently getting without it.

---

## 11. Month 2 Onward — the recurring cadence

Once setup completes, the retainer settles into this rhythm:

**Weekly**
- 1 GBP post + photos
- Review responses
- Deliverability + quality-rating check

**Monthly**
- 2–4 WhatsApp broadcasts
- 2 designed email campaigns
- On-page SEO iteration against ranking data
- Monthly report to client

**Expectation to keep restating:** per the proposal, **rankings and direct enquiries typically show from the third month.** Month 1 is setup, month 2 is consistent campaigns, month 3 is results. Say it in every report so it never becomes a surprise.

---

## 12. Client Communication Log

| Date | Channel | Subject | Outcome |
|------|---------|---------|---------|
| 2026-07-31 | Email | Proposal — SEO, WhatsApp & Email Marketing | ✅ Approved |
| 2026-08-01 | Email | Onboarding — access & details needed | ☐ Sent |
| | | | |

---

*Last updated: 2026-08-01 · Update this file as you go — it is the audit trail for the engagement.*
