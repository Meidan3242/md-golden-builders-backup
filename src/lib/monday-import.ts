import "server-only";
import { sql } from "./db";
import { boardItems, type MondayItem } from "./monday";
import { sanDiegoToUtc } from "./time";
import type { LeadSource, LeadStage } from "./types";

/** "Rowel Reyes (google)" → name + source. */
function nameAndSource(raw: string): { name: string; source: LeadSource } {
  const m = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const name = (m ? m[1] : raw).trim() || raw.trim();
  const tag = (m?.[2] ?? "").toLowerCase();
  const source: LeadSource =
    tag.includes("thumb") ? "Thumbtack"
    : tag.includes("google") || tag.includes("lsa") ? "Google"
    : tag.includes("yelp") ? "Yelp"
    : tag.includes("insta") ? "Instagram"
    : tag.includes("face") || tag === "fb" ? "Facebook"
    : tag.includes("refer") ? "Referral"
    : tag.includes("web") ? "Website"
    : "Other";
  return { name, source };
}

const STAGE: Record<string, LeadStage> = {
  estimate: "Estimate Sent",
  "follow up": "Estimate Sent",
  sold: "Won",
  "need to send estimate": "Need to Send Estimate",
  cancel: "Lost",
  "do not call/job done": "Not a Fit",
  "not yet ready/paused": "Paused",
  reschedule: "Trying to Reach",
};

function phone(raw: string) {
  const d = raw.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw;
}

function city(address: string) {
  const m = address.match(/,\s*([A-Za-z .'-]+?)\s*,?\s*CA\b/i);
  return m ? m[1].trim() : "";
}

/** monday "Date" + "Hour" are San Diego local time. */
function visitTime(date: string, hour: string) {
  const day = date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const h = hour.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hh = 9, mm = 0;
  if (h) {
    hh = (Number(h[1]) % 12) + (h[3].toUpperCase() === "PM" ? 12 : 0);
    mm = Number(h[2]);
  }
  return sanDiegoToUtc(`${day}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
}

function toRows(items: MondayItem[], boardName: string) {
  return items.map((i) => {
    const c = i.cols;
    const { name, source } = nameAndSource(i.name);
    const status = (c["status"] ?? "").toLowerCase();
    const visit = visitTime(c["date"] ?? "", c["hour"] ?? "");
    const stage: LeadStage = STAGE[status] ?? (visit ? "Appointment Set" : "New");
    const amount = Number((c["estimate total"] ?? "").replace(/[^0-9.]/g, ""));
    const service = (c["requested service"] ?? "").trim();
    const notes = [
      service.length > 60 ? service : "",
      c["comments"] ?? c["notes"] ?? "",
      `From monday (${boardName}) · status "${c["status"] || "Blank"}"${c["follow up?"] ? ` · follow up: ${c["follow up?"]}` : ""}`,
      c["estimates"] ? "Estimate PDF is in monday" : "",
    ].filter(Boolean).join("\n");
    const created = new Date(i.created_at);
    return {
      lead: {
        id: `M-${i.id}`,
        monday_id: i.id,
        monday_board: boardName,
        name,
        phone: phone(c["phone"] ?? ""),
        email: c["email"] || null,
        address: c["property address"] ?? "",
        city: city(c["property address"] ?? ""),
        service: service ? (service.length > 60 ? `${service.slice(0, 57)}…` : service) : "Other",
        source,
        stage,
        notes,
        estimate_amount: amount > 0 ? amount : null,
        estimate_sent_at: ["Estimate Sent", "Won", "Lost", "Paused"].includes(stage) && amount > 0 ? (visit ?? created) : null,
        closed_at: stage === "Appointment Set" ? created : null,
        created_at: created,
      },
      visit: visit ? { monday_id: i.id, lead_id: `M-${i.id}`, title: `Site visit — ${name}`, type: "Site Visit", start_at: visit, assigned_to: "u-owner", confirmation: "Confirmed" } : null,
      followUp: (c["follow up?"] ?? "").toLowerCase() === "yes" && stage === "Estimate Sent" && Date.now() - created.getTime() < 45 * 86_400_000
        ? { monday_id: i.id, lead_id: `M-${i.id}`, step: "monday", due: new Date(), action: "Follow up (flagged in monday)", assigned_to: "u-office" }
        : null,
    };
  });
}

/** Pull a monday leads board into the app. Safe to run again: it updates the same leads instead of duplicating. */
export async function importBoard(boardId: string) {
  const { board, items } = await boardItems(boardId);
  const rows = toRows(items, board);
  if (!rows.length) return `${board}: no items`;
  const db = sql();
  const leads = rows.map((r) => r.lead);
  const visits = rows.flatMap((r) => (r.visit ? [r.visit] : []));
  const follows = rows.flatMap((r) => (r.followUp ? [r.followUp] : []));
  await db.begin(async (tx) => {
    await tx`set local lock_timeout = '8s'`; await tx`set local statement_timeout = '50s'`; await tx`set local idle_in_transaction_session_timeout = '60s'`; // never leave the database locked
    for (let i = 0; i < leads.length; i += 200) {
      await tx`
        insert into leads ${tx(leads.slice(i, i + 200))}
        on conflict (monday_id) do update set
          name = excluded.name, phone = excluded.phone, email = excluded.email, address = excluded.address, city = excluded.city,
          service = excluded.service, source = excluded.source, stage = excluded.stage, notes = excluded.notes,
          estimate_amount = excluded.estimate_amount, estimate_sent_at = coalesce(leads.estimate_sent_at, excluded.estimate_sent_at),
          monday_board = excluded.monday_board, updated_at = now()`;
    }
    for (let i = 0; i < visits.length; i += 200) {
      await tx`insert into appointments ${tx(visits.slice(i, i + 200))}
               on conflict (monday_id) do update set start_at = excluded.start_at, title = excluded.title`;
    }
    if (follows.length) await tx`insert into follow_ups ${tx(follows)} on conflict (monday_id) do nothing`;
  });
  const by = leads.reduce<Record<string, number>>((a, l) => ((a[l.source] = (a[l.source] ?? 0) + 1), a), {});
  return `${board}: ${leads.length} leads (${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(", ")}) · ${visits.length} visits · ${follows.length} follow-ups`;
}
