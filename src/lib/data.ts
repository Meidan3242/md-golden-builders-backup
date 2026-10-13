// Data access layer. Every read goes through the current user so a sales rep
// only ever receives their own leads and projects. When the database is
// connected, the same rule is enforced again with Row-Level Security.
import { cookies } from "next/headers";
import {
  APPOINTMENTS,
  FOLLOW_UPS,
  LEADS,
  MARKETING_SPEND,
  PROJECTS,
  SUBCONTRACTORS,
  USERS,
} from "./demo-data";
import type { Lead, Project, User } from "./types";

export async function currentUser(): Promise<User> {
  const id = (await cookies()).get("demo_user")?.value;
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

export const canSeeAll = (u: User) => u.role === "admin" || u.role === "office";
export const canSeeMoney = (u: User) => u.role === "admin" || u.role === "office";

export const userById = (id: string) => USERS.find((u) => u.id === id);
export const allUsers = () => USERS;

export async function getLeads(): Promise<Lead[]> {
  const u = await currentUser();
  return canSeeAll(u) ? LEADS : LEADS.filter((l) => l.assignedTo === u.id);
}

export async function getLead(id: string) {
  return (await getLeads()).find((l) => l.id === id);
}

export async function getProjects(): Promise<Project[]> {
  const u = await currentUser();
  return canSeeAll(u) ? PROJECTS : PROJECTS.filter((p) => p.assignedTo === u.id);
}

export async function getProject(id: string) {
  return (await getProjects()).find((p) => p.id === id);
}

export async function getAppointments() {
  const u = await currentUser();
  const list = canSeeAll(u) ? APPOINTMENTS : APPOINTMENTS.filter((a) => a.assignedTo === u.id);
  return [...list].sort((a, b) => a.start.localeCompare(b.start));
}

export async function getFollowUps() {
  const leads = await getLeads();
  const ids = new Set(leads.map((l) => l.id));
  return FOLLOW_UPS.filter((f) => ids.has(f.leadId)).sort((a, b) => a.due.localeCompare(b.due));
}

export const getSubcontractors = async () => SUBCONTRACTORS;
export const subById = (id: string) => SUBCONTRACTORS.find((s) => s.id === id);
export const getMarketingSpend = async () => MARKETING_SPEND;

// ---------------------------------------------------------------- money

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function projectFinancials(p: Project) {
  const signedCOs = p.changeOrders.filter((c) => c.status === "Signed");
  const revenue = p.contractValue + sum(signedCOs.map((c) => c.amount));
  const allMilestones = [...p.milestones, ...signedCOs.flatMap((c) => c.milestones)];
  const collected = sum(allMilestones.filter((m) => m.status === "Paid").map((m) => m.amount));
  const invoiced = sum(allMilestones.filter((m) => m.status === "Invoiced" || m.status === "Overdue").map((m) => m.amount));
  const subs = [...p.subs, ...signedCOs.flatMap((c) => c.subs)];
  const subCommitted = sum(subs.map((s) => s.amount));
  const subPaid = sum(subs.flatMap((s) => s.payments).filter((x) => x.status === "Paid").map((x) => x.amount));
  const subRequested = sum(subs.flatMap((s) => s.payments).filter((x) => x.status === "Requested").map((x) => x.amount));
  const expenses = sum([...p.expenses, ...signedCOs.flatMap((c) => c.expenses)].map((e) => e.amount));
  const cost = subCommitted + expenses;
  const profit = revenue - cost;
  return {
    revenue,
    collected,
    invoiced,
    balance: revenue - collected,
    subCommitted,
    subPaid,
    subRequested,
    expenses,
    cost,
    profit,
    margin: revenue ? profit / revenue : 0,
  };
}

/** Problems that need attention on a project (missing waivers, unsigned agreements...). */
export function projectAlerts(p: Project) {
  const alerts: string[] = [];
  const subs = [...p.subs, ...p.changeOrders.flatMap((c) => c.subs)];
  for (const s of subs) {
    const name = subById(s.subId)?.company ?? "Sub";
    if (s.agreement !== "Signed") alerts.push(`${name}: subcontractor agreement ${s.agreement.toLowerCase()}`);
    for (const pay of s.payments) {
      if (pay.status === "Paid" && pay.lienWaiver === "Missing") alerts.push(`${name}: lien waiver missing for paid "${pay.name}"`);
      if (pay.status === "Paid" && !pay.proof) alerts.push(`${name}: no payment proof for "${pay.name}"`);
      if (pay.status === "Requested") alerts.push(`${name} requested $${pay.amount.toLocaleString()} — "${pay.name}"`);
    }
  }
  const missingReceipts = p.expenses.filter((e) => !e.receipt).length;
  if (missingReceipts) alerts.push(`${missingReceipts} expense(s) without a receipt`);
  return alerts;
}

/**
 * A project as a list of contracts: #1 is the original, #2 is change order 1, #3 is
 * change order 2… Payments, subs and expenses are always shown under their contract.
 */
export function contractsOf(p: Project) {
  return [
    { n: 1, label: "Contract #1", kind: "Original contract", title: p.type, amount: p.contractValue, status: "Signed" as const, signedAt: p.signedAt, milestones: p.milestones, subs: p.subs, expenses: p.expenses },
    ...p.changeOrders.map((c) => ({ n: c.number + 1, label: `Contract #${c.number + 1}`, kind: `Change order #${c.number}`, title: c.title, amount: c.amount, status: c.status, signedAt: c.signedAt, milestones: c.milestones, subs: c.subs, expenses: c.expenses })),
  ];
}
export type ContractView = ReturnType<typeof contractsOf>[number];
