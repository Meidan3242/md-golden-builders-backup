// Data access layer. Every read goes through the current user so a sales rep
// only ever receives their own leads and projects. When the database is
// connected, the same rule is enforced again with Row-Level Security.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNTS } from "./accounts";
import { dbConfigured } from "./clock";
import { isRevoked, validAfter } from "./logins";
import { authSecret, readSession, SESSION_COOKIE } from "./session";
import {
  APPOINTMENTS,
  FOLLOW_UPS,
  LEADS,
  MARKETING_SPEND,
  PROJECTS,
  SUBCONTRACTORS,
  USERS,
} from "./demo-data";
import { dbReady } from "./db";
import { dbAppointments, dbFollowUps, dbLeads } from "./lead-repo";
import { dbProjects } from "./project-repo";
import { schemaVersion } from "./db";

/** Real projects once the projects tables exist (schema v4); until then, the demo projects. */
export async function projectsReal() {
  return ((await schemaVersion()) ?? 0) >= 4;
}
async function allProjects() {
  return (await projectsReal()) ? dbProjects() : PROJECTS;
}
export const isActive = (p: Project) => p.stage !== "Completed" && p.stage !== "Cancelled";
import type { Lead, Project, User } from "./types";

/** Leads come from the real database once it's set up; until then, the demo leads. */
async function allLeads() {
  return (await dbReady()) ? dbLeads() : LEADS;
}

/** Who is really logged in (signed session cookie, not cut by "log out everywhere" or a password change). */
export async function loggedInUser(): Promise<User | null> {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value, authSecret());
  if (!s) return null;
  if (s.iat < (await validAfter(s.u))) return null;
  if (await isRevoked(s.sid)) return null; // logged out on this device
  return USERS.find((u) => u.id === s.u) ?? null;
}

/** The logged-in user. Every data function below starts here, so nothing is returned without a valid session. */
export async function currentUser(): Promise<User> {
  const me = await loggedInUser();
  if (!me) redirect("/login"); // no data without a valid, uncut session — even if the middleware let the request through
  return me;
}

export const canSeeAll = (u: User) => u.role === "admin" || u.role === "office";
export const canSeeMoney = (u: User) => u.role === "admin" || u.role === "office";
/** Money inside a project (customer payments, subs, expenses, stages). Project managers see it too. */
export const canSeeProjectMoney = (u: User) => canSeeMoney(u) || u.role === "pm";

export const userById = (id: string) => USERS.find((u) => u.id === id);
export const allUsers = () => USERS;

export async function getLeads(): Promise<Lead[]> {
  const u = await currentUser();
  if (u.role === "pm") return []; // project managers never see leads
  const leads = await allLeads();
  return canSeeAll(u) ? leads : leads.filter((l) => l.assignedTo === u.id);
}

export async function getLead(id: string) {
  return (await getLeads()).find((l) => l.id === id);
}

/**
 * For actions that CHANGE a lead: the lead, only if this person may see it (sales reps: their own;
 * project managers: none). Throws otherwise — a lead id typed into a request is never enough.
 */
export async function leadForChange(id: string) {
  const user = await currentUser();
  if (user.role === "pm") throw new Error("Not allowed");
  const lead = id ? await getLead(id) : undefined;
  if (!lead) throw new Error("Not allowed");
  return { user, lead };
}

export async function getProjects(): Promise<Project[]> {
  const u = await currentUser();
  const projects = await allProjects();
  if (u.role === "pm") return projects.filter(isActive); // active projects only
  return canSeeAll(u) ? projects : projects.filter((p) => p.assignedTo === u.id);
}

export async function getProject(id: string) {
  return (await getProjects()).find((p) => p.id === id);
}

export async function getAppointments() {
  const u = await currentUser();
  const active = new Set((await allProjects()).filter(isActive).map((p) => p.id));
  // Real lead meetings from the database (+ demo project appointments only while projects are still demo).
  const all = (await dbReady()) ? [...(await dbAppointments()), ...((await projectsReal()) ? [] : APPOINTMENTS.filter((a) => a.projectId))] : APPOINTMENTS;
  const list =
    u.role === "pm" ? all.filter((a) => a.projectId && active.has(a.projectId))
    : canSeeAll(u) ? all
    : all.filter((a) => a.assignedTo === u.id);
  return [...list].sort((a, b) => a.start.localeCompare(b.start));
}

export async function getFollowUps() {
  if (await dbReady()) dbFollowUps(); // start the query now, in parallel with the leads
  const leads = await getLeads();
  const ids = new Set(leads.map((l) => l.id));
  const all = (await dbReady()) ? await dbFollowUps() : FOLLOW_UPS;
  return all.filter((f) => ids.has(f.leadId)).sort((a, b) => a.due.localeCompare(b.due));
}

// With the real database connected, the fictional sample subcontractors and marketing numbers are never shown.
const sample = () => !dbConfigured();
export const getSubcontractors = async () => (sample() ? SUBCONTRACTORS : []);
export const subById = (id: string) => (sample() ? SUBCONTRACTORS.find((s) => s.id === id) : undefined);
export const getMarketingSpend = async () => (sample() ? MARKETING_SPEND : []);

/** Who a lead can be assigned to: the owner and sales reps — with real data, only people who can actually log in. */
export const assignableUsers = () => USERS.filter((u) => (u.role === "admin" || u.role === "sales") && (sample() || Object.values(ACCOUNTS).includes(u.id)));

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
