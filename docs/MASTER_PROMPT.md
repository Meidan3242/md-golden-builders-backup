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

## 9. Working rules for me

- Work on branch `claude/project-management-system-g36bde`; small, clear commits.
- Never hard-code secrets; use env vars.
- Every new table gets RLS policies + a test that a salesperson can't read others' data.
- Keep `docs/` updated with decisions (ADR-style).
