# MD Golden Builders OS — Master Build Prompt

> This is the brief I (Claude) follow every time I work on this project.
> If a decision here changes, update this file first.

## 1. Who the client is

**MD Golden Builders** is a home-remodeling contractor in **San Diego, CA**
(kitchens, bathrooms, ADUs, additions, full remodels). Owner: the admin user.
The business runs today on a patchwork of tools:

| Tool | What it's used for today |
|---|---|
| Yelp, Thumbtack, Instagram, Meta (Facebook) ads, WhatsApp, website, referrals | Lead sources — customers call or message |
| RingCentral ("Ring") | A remote secretary (Philippines) answers calls; **calls are recorded** |
| monday.com | Secretary logs the lead; owner works from it |
| Joist | Estimates / quotes sent to customers |
| Phone / WhatsApp / camera roll | Photos, videos, receipts, sub-contractor comms |

**Goal:** one English-language web app (mobile-friendly, later installable as PWA)
that becomes the single source of truth from first call → signed contract →
finished project → paid in full, with numbers the owner can trust.

## 2. The business flow to model

```
Lead source (Yelp / Thumbtack / IG / Meta / WhatsApp / Web / Referral)
   → Call answered by secretary (RingCentral, recorded)
   → LEAD created (source, contact, address, scope, recording attached)
   → Appointment / site visit scheduled, assigned to salesperson
   → Site visit
        ├─ SOLD  → contract signed → PROJECT
        │            → payment schedule (deposit + milestones)
        │            → permits (City of San Diego / county) & inspections
        │            → photos & videos (before / during / after)
        │            → subcontractors: assignments, bills, payments, lien waivers
        │            → expenses & receipts (materials, etc.)
        │            → change orders
        │            → completion, final payment, review request
        └─ NOT SOLD → estimate sent (Joist) → FOLLOW-UP sequence
                     → won (→ PROJECT) / lost (reason) / nurture
```

## 3. Users & permissions (RBAC)

- **Admin / Owner** — sees everything: all leads, all projects, all money,
  company dashboard, settings, user management.
- **Salesperson** — sees **only leads and projects assigned to them**
  (enforced at the database level, not just hidden in UI). Their own pipeline,
  commission view (optional), no company financials.
- **Office / Secretary** — creates & edits leads, schedules appointments,
  attaches call recordings, sees all leads; **no** financials.
- (Later) **Project manager / Field**, **Subcontractor portal**, **Customer portal**.

Every record has `owner_user_id`; Row-Level Security policies guarantee isolation.
Full audit log of who changed what.

## 4. Core modules

1. **Leads (CRM)** — pipeline board (Kanban) + table; stages:
   New → Contacted → Appointment Set → Visited → Estimate Sent → Follow-up →
   Won / Lost / Nurture. Fields: source, campaign, contact, address, project type,
   budget range, notes, assigned rep, next action date, lost reason.
   Duplicate detection by phone/email. Activity timeline per lead.
2. **Calls** — RingCentral integration: pull call logs + recordings, auto-match
   to lead by phone number, play inline, (phase 2) AI transcript + summary.
3. **Appointments** — calendar per rep, Google Calendar sync, reminders (SMS/email).
4. **Estimates & follow-ups** — link/import Joist estimates (amount, status, PDF);
   automatic follow-up tasks (e.g. day 2, 7, 14, 30); templates for SMS/email/WhatsApp.
5. **Projects** — created from a Won lead. Stages: Contract → Permits → Scheduled →
   In Progress → Inspection → Punch List → Completed → Closed.
   Contract value, change orders, timeline, documents, photos/videos gallery.
6. **Payments in (customer)** — payment schedule/milestones, invoices, received
   payments, balance due, overdue alerts. (Note CA rule: home-improvement deposit
   max $1,000 or 10% — the app should warn.)
7. **Permits** — permit #, jurisdiction, status, fees, inspection dates, documents.
8. **Subcontractors & vendors** — directory (trade, license #, insurance expiry,
   W-9), assignments per project, bills, payments out, lien waivers, 1099 totals.
9. **Expenses & receipts** — snap a receipt from phone, attach to project + category;
   (phase 2) OCR to auto-fill vendor/amount/date.
10. **Dashboard & reports** — admin: leads by source, cost per lead/ROI per source,
    conversion rate, avg deal size, pipeline value, revenue, collected vs. outstanding,
    project profit (contract + COs − subs − materials − expenses), rep leaderboard.
    Salesperson: only their own numbers.
11. **Files** — every lead/project has a file area (contracts, plans, photos, videos).
12. **Notifications** — new lead assigned, follow-up due, payment overdue,
    insurance expiring, permit status change.

## 5. Integrations (in priority order, each behind an adapter)

1. **monday.com** — one-time import of existing boards; optional two-way sync
   during transition, then retire.
2. **RingCentral** — OAuth app, call log + recordings API, webhooks.
3. **Joist** — no public API → start with manual link/PDF upload + email parsing
   of Joist notifications; revisit.
4. **Thumbtack** — Partner API / lead webhooks if approved; else email parsing.
5. **Yelp** — Yelp Leads API (if eligible) or email/notification parsing.
6. **Meta / Instagram** — Lead Ads webhook (Graph API) + WhatsApp Business API.
7. **Google Calendar, Gmail, Twilio (SMS)**, e-signature (e.g. Dropbox Sign/DocuSign),
   **QuickBooks Online** (accounting sync), **Stripe** (online card/ACH payments).

## 6. Tech stack (default unless the owner decides otherwise)

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** — responsive, English UI.
- **Supabase**: Postgres, Auth, Row-Level Security, Storage (photos/videos/recordings),
  Edge Functions/webhooks.
- Hosted on **Vercel**; domain e.g. `app.mdgoldenbuilders.com`.
- Background jobs (follow-ups, syncs) via cron / queue.
- Tests: Vitest + Playwright. Seed data for demo.

## 7. Non-functional requirements

- English UI, US formats (USD, MM/DD/YYYY, Pacific Time).
- Mobile-first for field use (upload photos from phone in 2 taps).
- Secure: RLS, least privilege, encrypted secrets, audit log, daily backups.
- Fast to adopt: import from monday, minimal typing for the secretary.
- Built in phases; every phase ships something usable.

## 8. Phases

- **Phase 0** — Discovery: answers to open questions, export monday boards, sample data.
- **Phase 1 (MVP)** — Auth + roles, Leads pipeline, Appointments, manual call-recording
  upload, follow-up tasks, basic admin dashboard, monday import.
- **Phase 2** — Projects, payments in, subs & payments out, expenses/receipts, permits,
  photo/video gallery, project P&L.
- **Phase 3** — Integrations: RingCentral auto-sync, Meta/IG/WhatsApp, Thumbtack, Yelp,
  Joist workaround, Google Calendar, SMS.
- **Phase 4** — Automation & AI: call transcription/summary, auto lead scoring,
  receipt OCR, auto follow-up messages, QuickBooks, Stripe, customer portal.

## 9. Decisions from the owner (Discovery round 1 — 2026-10-10)

**Users today:** 2 — Owner (admin) + Secretary (Philippines). Field crew: no access for now.
Salespeople later; owner assigns every lead manually. If a rep leaves, their leads
and projects re-assign to the owner. Commission per rep (typically 15% or 20%) — later.

**Lead volume & spend (~90 leads/month):** ~30% Google, ~30% Yelp, ~30% Thumbtack.
Monthly spend: Google ~$6,000, Thumbtack ~$1,600, Yelp ~$1,500, marketing manager ~$1,000.
→ Every lead MUST have a required `source` (and optional campaign). The current monday
board has no source column, so ROI per source cannot be measured today. Marketing spend
is entered monthly per source → dashboard shows cost per lead, cost per sale, ROI.

**Current monday structure (workspace "2026"):**
- `LEADS 2026` (≈405 items, grouped by month): Name, Date, Hour, Property Address,
  Requested Service, Email, Phone, Estimate Total, Status, Follow Up?, People,
  Estimates (file), Google Calendar event, Comments.
  Status labels: Need to send estimate, Estimate, Follow Up, Reschedule,
  Not yet ready/paused, Sold, Cancel, DO NOT CALL/JOB DONE, Blank.
  Snapshot: 205 leads sit in "Estimate" (~$3.4M in open estimates); 39 Sold.
- `Clients 2026` (39 items): Requested Service, Property Address, Sale, cost, Profit, Status.
- `Call Backs 2026` (grouped Google / Thumbtack / Yelp): Date, Phone, Reason for Call, Status, Notes.
- Also: `Schedule Junk Removal Leads`, `Monthly Sales Dashboards 2026`.
Import maps these into Leads / Projects / Call log. Keep monday running in parallel
during transition (owner's choice).

**Follow-up rule:** estimate sent → task Day 1 (call + text), Day 3 (call + text),
then Day 7, 14, 30. Goal of follow-up = **book a second meeting**. "Hot" leads go to the
owner, routine "checking in" follow-ups go to the secretary. Second-meeting outcome tracked.

**Calls:** secretary answers from the business RingCentral number; owner has admin.
Store and play the **recording** on each lead (must-have). No transcript needed;
short AI summary is optional/nice-to-have.

**Unified inbox:** owner wants to reply to leads from inside the app (SMS from the
business number via RingCentral SMS API, email; WhatsApp later).

**Contracts — build our own e-sign:** Joist lacks California-required pieces.
App generates the company contract (CA B&P §7159 home-improvement contract:
CSLB license #, Mechanics Lien Warning, 3-Day Right to Cancel notice, payment schedule,
start/completion dates, etc.), emails it, customer signs on phone, signed PDF + audit
trail stored. Template text must be reviewed by a CA construction attorney.

**Payment schedule (default template, owner will confirm exact %):**
Deposit = $1,000 or 10% of contract, whichever is less (CA law) → progress payments
(owner mentioned 35% / 25% / 25% / 10% final — to be confirmed so totals reconcile).
Progress payments may not exceed work completed (CA rule) → tie each to a milestone.

**Change orders:** sent and e-signed like a contract. Each change order is a
**sub-project** with its own scope, price, payment schedule, subcontractors and costs;
rolls up into the parent project's totals and P&L.

**Permits:** City of San Diego, County of San Diego, Chula Vista, and other cities.

**Subcontractors:** must track license # + insurance (with expiry alerts) and lien
waivers. Paid by check, Zelle, cash, Venmo → every payment-out recorded with method,
reference #, date and a proof attachment (photo of check / screenshot).

**Money in:** no QuickBooks; bank transfers. Customers pay by card via **Square** →
integrate Square (payment links / invoices from the app, webhooks mark payments paid).
Reduce the ~2.5–3% card fee: offer ACH bank transfer, Zelle/check (recorded manually),
and evaluate legal card-surcharge options (California rules apply).

**Devices:** must work equally on phone and desktop (responsive + installable PWA).
Branding: company logo & colors (to be provided). Domain: mdgoldenbuilders.com subdomain OK.
Infra budget (~$0–50/mo to start) approved.

**#1 pain:** everything is scattered. Goal: one system with clear sections —
Leads, Inbox, Calendar, Projects, Payments, Subcontractors, Permits, Expenses, Reports.

## 10. Decisions — Discovery round 2 (2026-10-10)

**Company info:** MD Golden Builders · CSLB License #1128874 ·
4275 Mission Bay Drive #359, San Diego, CA 92109 · 858-933-1694 · info@mdgoldenbuilders.com

**Brand:** logo at `brand/logo.jpg` (gold houses + black). Palette:
gold `#D09028` (gradient `#E8A92E` → `#B07020`), black `#111111`, white background.

**Contract today:** Builder's Book **Form 203** Home Improvement Contract (5 pages,
B&P §7159 / Civ. Code §8170) + **Form 204C Additional Description** pages
(scope of work by section, materials, inspection, exclusions, contract price,
payment schedule — each page signed by contractor and owner).
Signature/initial points on Form 203: owner initials (receipt of copy), initial boxes
(notices), owner signature + date (and 2nd owner), contractor signature + date,
Notice of Cancellation receipt acknowledgment, arbitration initials (owner + contractor),
customer acknowledgment of notices (sign + date).
⚠️ Forms are © Builder's Book ("permission must be granted for reproduction") — we must
NOT copy their text into the app. Options: (A) attorney-drafted MD Golden Builders
contract template that meets §7159 (recommended long-term), (B) licensed digital forms,
(C) MVP: generate our own Scope/Payment pages + e-sign over an uploaded filled PDF.
Never commit customer contracts/PII to the repo.

**Payment schedule example (real contract, $85,760):** $1,000 deposit, then
$33,904 upon start of demo, $33,904 upon footings, $8,476 upon stucco, $8,476 completion
(= remainder split 40/40/10/10 by milestone). → Payment schedules are **templates with
named milestones**, editable per contract; each milestone: % or $, trigger (stage/date),
invoice, status.

**After signing (automated):** welcome email ("thank you for choosing us") with the
signed contract PDF attached and the payment schedule listed. Project then either starts
right away or waits on permits (architect/engineer submits plans to the city) — project
status `Waiting on Permit` with permit tracking.

**Media:** photos & videos before / during / after, uploaded from phone straight into the
project (replaces per-project WhatsApp groups where info gets lost).

**Completion:** email with Completion Form + **warranty specific to the work type**
(warranty templates per service) + review links (Google, Yelp, Thumbtack).

**Subcontractor payments:** each sub on a project has its own payment schedule
(milestones, like customers) and payment records with proof. Applies to change orders too.

**Joist:** stays for estimates (owner likes open-notifications). App only attaches the
Joist estimate PDF (+ amount) to the lead.

**Out of scope:** Junk Removal business — separate, never in this app.

**Roles updated:** Secretary = **Office Manager**, full access incl. money and projects
(she also helps roll out the system). Salespeople = own leads/projects only.

**Appointments:** secretary schedules, owner attends (incl. second meetings).
Auto SMS to customer **1 day before every appointment**: "Reply 1 to confirm" →
appointment shows Confirmed / Not confirmed; unconfirmed ones alert the secretary.

## 11. Decisions — Discovery round 3 (2026-10-10)

**Contract (MVP = option C):** the app fills the owner's Form 203 + 204C PDFs with
lead/project data (owner name, address, phone, email, price, deposit, dates, scope,
payment schedule) and places e-signature / initials / date fields at every required spot;
customer signs on phone; signed PDF + audit trail (IP, timestamp, email) stored on the
project. Owner should confirm with Builder's Book that their license covers digital use.
In parallel: find a CA construction attorney to draft an MD Golden Builders–owned
contract template (long-term replacement).

**Warranty:** workmanship warranty, **1 year or 5 years** depending on the work.
Warranty term chosen per project/service; printed on the Completion Form.
(Owner will send the current Completion Form.)

**Media:** internal gallery per project (before / during / after); optional
"share gallery with customer" link (nice-to-have); easy export for Instagram posts.
Future idea (not in scope now): video editing/reels from project media.

**Subcontractors (dozens):** no agreements today → app adds a **Subcontractor Agreement
per project** (scope, price, payment milestones, insurance/license requirement,
lien-waiver requirement), e-signed by the sub. Template to be drafted and attorney-reviewed.
**Lien waivers:** use California **statutory** release forms (Civ. Code §§8132–8138:
conditional/unconditional × progress/final). Rule in app: collect a *conditional* waiver
before each sub payment, *unconditional* after payment clears.

**Review links:** owner Linktree https://linktr.ee/mdgoldenbuilders (contains Google / Yelp / Thumbtack). Store each direct review URL in Settings; Linktree is the fallback.

**Welcome email:** drafted in `docs/templates/welcome-email.md`.

## 12. Decisions — round 4 (2026-10-10)

- **Phone (correct):** 858-933-**1694**.
- **Theme:** white background by day, black by night (auto 7am–7pm), gold accents stay;
  manual Light / Dark / Auto toggle.
- **Review links:** Google https://tr.ee/xLG1j2NoRY · Yelp https://tr.ee/ffZ0n6Xp5- ·
  Thumbtack https://tr.ee/kiBOFNYW8q
- Owner may send screenshots (WhatsApp with office, Instagram, customer chats, sub payment
  requests) to refine real workflows.

## 13. Prototype v0.1 (built)

Next.js 15 + TypeScript + Tailwind v4, demo data only (no database yet).
Screens: Dashboard, Leads (pipeline + list + detail + new), Follow-ups, Calendar,
Projects (list + detail with tabs: Overview, Customer payments, Change orders,
Subcontractors, Expenses, Permits, Photos & videos, Documents), Payments,
Subcontractors, Reports, Inbox (placeholder), Settings. Demo role switcher shows the
Owner / Office Manager / Sales Rep views. Screenshots in `docs/screenshots/`.

## 14. What the owner's day-to-day screenshots showed (2026-10-11)

(Real customer names/addresses intentionally NOT stored here.)

1. **Customers text the owner in iMessage group chats** (customer + spouse + owner) and
   ask "did you hear back from the city?". Owner answers manually with a screenshot of the
   City of San Diego permit portal (record `PRJ-…`, status "In Review", review tasks).
   → Permit record # + portal link per project; one-tap **"Send project update"** text to
   all customer contacts; later: automatic permit-status check + weekly update text.
   → A project has **multiple customer contacts** (spouses), all receive updates.
2. **Contacts are saved as "Name + street"** — the address is how the team identifies a job.
   → Search by address everywhere; project title = street address.
3. **One WhatsApp group per project** (name = address, icon = customer name). The office
   manager posts a running money summary by hand: list of contracts (contract, 2nd, 3rd,
   4th contract = change orders), total, payments received with dates, total paid,
   balance left, payment schedule, expenses, sub invoices ("<sub> invoice.pdf" → "Paid ✓"),
   notes like "client needs to pay +$550 for X (not added to total)", and @MD questions
   ("is this ongoing?", "chris paid for it already").
   → The app generates this **Project money summary automatically** (+ "Copy for WhatsApp").
   → **Pass-through / extra charges** not in the contract total (e.g. extra cement) tracked
   separately until billed.
   → **Project chat/comments with @mentions** replace the WhatsApp group for internal talk.
4. **Owner breaks each contract into scope line items with sub cost**, e.g.
   "Drywall-garage $5,000 · Back yard $20,000 paid (sub: Carlos) · Tankless paid in full ·
   HVAC $9,000 · Bathroom plumbing $4,500 · Railing $1,500".
   → Each contract/change order has **line items: scope · customer price · assigned sub ·
   sub cost · paid status**. Budget vs actual per line.
5. **Home Depot Pro**: crew members buy materials at the store; owner approves by SMS
   ("Reply 1 to approve"); orders are tagged with a **job name**.
   → Expenses import from Home Depot Pro purchase history (CSV) matched by job name;
   project gets a short "job name" used at suppliers.
6. **RingCentral**: office texts customers from the business line (858) 332-2168
   ("Hi …, this is Laine with MD Golden Builders. Just checking in…"); customers reply with
   gate codes, updates. RingCentral already produces **AI Notes** (summary, recap, tasks,
   transcript) per call → pull RingCentral's own AI notes + recording, no need to build ours.
   → Existing follow-up texts become the Day 1 / Day 3 templates.

## 15. Project chat + smart capture (requested 2026-10-11)

Every project gets a **Chat & updates** feed (replaces the internal WhatsApp group).
The owner/office drop free text, screenshots, PDFs, photos or voice notes; an AI
assistant (Claude, vision) extracts a structured entry and files it:
- "customer paid 5000 zelle contract 2" + screenshot → customer payment on Contract/CO #2,
  screenshot saved under Documents › Receipts, money summary updated.
- "/paid juan 1000 check 1187" (+ photo) → sub payment with method + proof; auto-request
  lien waiver from the sub by text.
- receipt photo → expense; sub invoice PDF → sub invoice awaiting approval; photos → gallery.
- Slash commands: /received, /paid, /expense, /co, /task.
Rules: money entries show a capture card; unclear ones need one-tap Confirm; every entry
undoable; audit trail. Later: same capture from SMS/WhatsApp forwarded to a system number.

**Phones:** keep RingCentral (calls, recordings, AI notes, SMS via API). Customer chats stay
on SMS/iMessage from the business line; internal WhatsApp groups move into the app.

## 16. Clarifications (2026-10-11)

- **Phones:** owner's number **858-933-1694** is printed on contracts and customer
  documents. RingCentral business line **(858) 332-2168** is used by the office for calls/SMS.
- **❌ in WhatsApp group names = active/running project** (not cancelled).
- **"Second / third / fourth contract" = change orders.** In the UI, label change orders so
  the team recognises both terms, e.g. "Change Order #1 (Contract #2)".

## 17. Discovery round 5 (2026-10-11)

**Office manager's name: Laline.**

**Unified lead inbox.** Owner already runs an auto-responder "robot" on Yelp + Thumbtack
(Google not yet). Goal: every lead from every platform lands in the app; reply from the app.
- Intake per source, best available: Thumbtack partner API · Yelp Leads API (partner
  approval needed) · Google Local Services leads via Google Ads API · calls via RingCentral ·
  **fallback for all: email-notification parsing** (forward lead emails to a system inbox).
- Reply: via API where the platform allows; otherwise SMS from the business line when
  there's a phone; otherwise deep link to the platform thread.
- **Hot lead = has phone number** (call + text). **Cold = no phone** (auto message on platform).
- **End-of-day digest** (owner + Laline): leads not answered yet, by hot/cold.

**Joist.** No public API known → (1) auto-capture from Joist emails (estimate sent/viewed,
PDF) if available, else drag-and-drop PDF; (2) later build estimates in-app (same scope +
payment schedule feeds the contract in one click, own open-tracking). Owner likes Joist's
"opened" notification — must keep that.

**Follow-up = goal is a second meeting** ("second meeting is a near-certain close").
Re-engagement message library, e.g. "crew opening — project delayed by city inspection, can
start you earlier, I'm in your area tomorrow 2–4pm", limited-time 10% discount, price increase
coming. AI personalises with name/project. **"Nearby open estimates"**: when the owner has an
appointment, suggest open-estimate leads in the same area to swing by. Track which message
wins second meetings. Discounts need owner approval.

**Contract package = Form 203 + Additional Description pages (scope of work) — all signed.**
App fills the owner's PDF and places e-sign fields at every required spot (see §10 list +
every Additional Description page: contractor + owner signature). Notice of Cancellation
copies are delivered, not signed. Change Order form: owner will send.

**Customer payment options** (show all on every invoice / payment page):
Zelle MDgoldenbuilders@gmail.com · Venmo https://venmo.com/code?user_id=3483491786294445630 ·
check payable to "MD Golden Builders" · cash · card via Square payment link (Square API:
create link, webhook marks paid). Owner wants to pass the card fee (~3.5%) to the customer →
must check rules first (card networks cap surcharges ~3%, no surcharge on debit, CA
SB 478 price-transparency rules) — confirm with accountant/attorney; alternative is a
"cash/Zelle price" framing. Zelle has no API → mark paid from screenshot (smart capture) or
bank alert email. Goal: collect fast — auto reminders on due/overdue invoices.

**Weekly sub pay run:** every **Thursday** the app lists each sub's balance per project and
proposes Friday payments; owner adjusts/approves; app texts each sub "Tomorrow you'll get $X
for <project> via Zelle — reply 1 to confirm"; Friday: grouped list by method (Zelle list,
checks to write, cash, Venmo); mark paid with proof. Subs keep requesting on WhatsApp for now
(capture via project chat).

**Home Depot Pro Xtra.** Receipts are tagged with a job name (usually the street/area, e.g.
"6390 Lakeshore", "Spring Valley"). Purchase-approval SMS ("Arturo at store … reply 1")
arrives on the **RingCentral line** → app can show Approve/Deny and reply via RingCentral SMS
API. Receipts: no public HD API known → email e-receipts to a system inbox (or Pro Xtra
export) → match job name → project; ask the owner which sub when unclear.

## 18. Discovery round 6 (2026-10-11)

- **Lead robot today: InstantResponse.AI** (app.instantresponse.ai) answers Yelp + Thumbtack
  leads and posts each new lead (name, phone, city/ZIP, service, link) into a WhatsApp group
  "Yelp Bot". → Preferred intake: pull leads from InstantResponse.AI (webhook/API/Zapier if
  they offer it) or parse its notifications; keep the robot doing first contact.
- **Home Depot:** most purchases are a sub's, some are the owner's → every receipt asks
  "whose is it / which sub?" when not obvious. Receipts must arrive automatically (no extra
  work for Laline): a dedicated receiving email address for the company
  (e.g. receipts@mdgoldenbuilders.com) set as the e-receipt email in Pro Xtra.
- **Laline may offer discounts in follow-ups — with owner approval** (approve button).
- **Daily digest at 6:00 PM.**
- **Payment schedules are always custom per project** — no fixed template; editor starts
  blank (or "copy from a past project").
- **Joist estimate format** (sample #553): logo, Prepared For, estimate #, date, line item
  with long scope text, notes ("1600 downpayment / 16,000 finance" → owner offers financing),
  subtotal/total, signature page. Joist app: Pending/Approved/Declined lists + open icon.
- **Customer-facing pages built (prototype):** `/p/estimate/[id]` (mobile estimate with
  add-on options, live total, payment schedule, pay methods, Approve & sign / Meet again /
  Ask) and `/p/sign/[id]` (Form 203 pages with sign/initial tags at the exact spots +
  generated Additional Description pages + checklist of all 13 spots). Form page images
  are licensed material → kept local only (`public/forms/` is git-ignored).
- Open-tracking for our own estimates: every view of the link is logged (count, time spent,
  sections viewed, add-ons toggled) → push notification "Rachel is viewing your estimate now".

## 19. Discovery round 7 (2026-10-11)

- **Estimate page:** no interactive add-ons; "Approve & sign / Meet / Ask" at the TOP next to
  the total. Zelle email must wrap inside its card. → done (`CustomerDoc` component).
- **Change Order = same page as the estimate, titled "Change Order"** (owner's paper CO form
  dropped). Shows original contract → +CO → new total and schedule impact.
  Laline creates it; customer signs from the link (email and/or text — both options).
- **Financing: Foundation Finance.** Pattern: customer pays a down payment (e.g. $1,600)
  and Foundation Finance pays the financed balance at the END of the project. Project flag
  "Financed" + lender milestone "Foundation Finance payout on completion".
- **System email: CRM@mdgoldenbuilders.com** (sends contracts/estimates; receives HD
  receipts and forwarded lead emails).
- **Google: $6,000/mo LSA only;** regular Google Ads just added (~+$3,000/mo). Marketing
  manager runs it and marks spam leads for **LSA refunds** → track per lead: spam?,
  dispute filed, refund received ($).
- InstantResponse.AI details: owner will ask the marketing manager (who installed it).
- **Cancelled projects** → status "Cancelled", moved to a "Cancelled projects" list
  (owner decides; no automatic refund flow).
- **Late payments & disappearing subs → owner decides.** System only collects facts from
  every source, flags, and reminds the owner.
- **Engineer/architect = a subcontractor** (same payments + documents).
- **Repeat customer:** one customer profile across projects; each new project still counts
  in that month's sales.
- **Only the owner takes project photos.**
- Simulation produced: filled Form 203 (5 pp.) + generated Additional Description (2 pp.)
  for a fictional $35,000 50-LF garden wall, sign/initial tags at all spots; email +
  SMS preview page `/p/email/[id]`. Real sending starts once CRM@ mailbox + email service
  are connected (this environment cannot send email).

## 20. Working rules for me

- Work on branch `claude/project-management-system-g36bde`; small, clear commits.
- Never hard-code secrets; use env vars.
- Every new table gets RLS policies + a test that a salesperson can't read others' data.
- Keep `docs/` updated with decisions (ADR-style).
