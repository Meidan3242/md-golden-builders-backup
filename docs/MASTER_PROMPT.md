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

## 10. Working rules for me

- Work on branch `claude/project-management-system-g36bde`; small, clear commits.
- Never hard-code secrets; use env vars.
- Every new table gets RLS policies + a test that a salesperson can't read others' data.
- Keep `docs/` updated with decisions (ADR-style).
