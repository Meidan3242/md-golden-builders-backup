import "server-only";
import { cache } from "react";
import { sql } from "./db";
import type { Appointment, FollowUp, Lead, LeadSource, LeadStage } from "./types";

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : undefined);

/** All leads with their conversation and activity — one round trip each. */
export const dbLeads = cache(async (): Promise<Lead[]> => {
  const db = sql();
  const [rows, msgs, acts] = await Promise.all([
    db`select * from leads order by created_at desc`,
    db`select * from lead_messages order by at`,
    db`select * from lead_activity order by at desc`,
  ]);
  const byLead = <T extends { lead_id: string }>(xs: readonly T[]) =>
    xs.reduce<Record<string, T[]>>((a, x) => ((a[x.lead_id] ??= []).push(x), a), {});
  const m = byLead(msgs as unknown as { lead_id: string; at: string; sender: string; channel: string; text: string }[]);
  const a = byLead(acts as unknown as { lead_id: string; id: number; at: string; by_user: string; kind: string; text: string }[]);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    address: r.address,
    city: r.city,
    service: r.service,
    source: r.source as LeadSource,
    stage: r.stage as LeadStage,
    createdAt: iso(r.created_at)!,
    assignedTo: r.assigned_to,
    attempts: r.attempts,
    notes: r.notes ?? undefined,
    estimateAmount: r.estimate_amount != null ? Number(r.estimate_amount) : undefined,
    estimateSentAt: iso(r.estimate_sent_at),
    estimateViewedAt: iso(r.estimate_viewed_at),
    estimatePdf: r.estimate_pdf ?? undefined,
    lostReason: r.lost_reason ?? undefined,
    projectId: r.project_id ?? undefined,
    closedAt: iso(r.closed_at),
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
    calls: [], // RingCentral recordings come in a later step
    thread: (m[r.id] ?? []).map((x) => ({ at: iso(x.at)!, from: x.sender as "customer" | "us" | "robot", channel: x.channel as "Text", text: x.text })),
    activity: (a[r.id] ?? []).map((x) => ({ id: String(x.id), at: iso(x.at)!, by: x.by_user, kind: x.kind as "note", text: x.text })),
  }));
});

export const dbAppointments = cache(async (): Promise<Appointment[]> => {
  const rows = await sql()`select * from appointments order by start_at`;
  return rows.map((r) => ({
    id: `db-${r.id}`,
    leadId: r.lead_id ?? undefined,
    projectId: r.project_id ?? undefined,
    title: r.title,
    type: r.type,
    start: iso(r.start_at)!,
    durationMin: r.duration_min,
    assignedTo: r.assigned_to,
    confirmation: r.confirmation,
  }));
});

export const dbFollowUps = cache(async (): Promise<FollowUp[]> => {
  const rows = await sql()`select * from follow_ups order by due`;
  return rows.map((r) => ({ id: String(r.id), leadId: r.lead_id, due: iso(r.due)!, step: r.step, action: r.action, assignedTo: r.assigned_to, done: r.done }));
});
