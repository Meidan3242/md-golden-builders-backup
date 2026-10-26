"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { currentUser, getLead } from "@/lib/data";
import { migrate, sql } from "@/lib/db";
import { emailReady, sendEmail } from "@/lib/email";
import { cancelDeadline, initialsOf, splitAddress, type ContractData, type ContractorSign, type OwnerSign } from "@/lib/contract-form";
import { contractById, contractByToken, contractOfEstimate, contractsReady, docHash, newContractToken, payInstructions } from "@/lib/contracts";
import { depositFor, paymentRows } from "@/lib/estimate-math";
import { estimateById } from "@/lib/estimates";
import { money } from "@/lib/format";
import { pushToTeam } from "@/lib/push";

const clean = (s: unknown, max = 300) => String(s ?? "").trim().slice(0, max);

/** Staff who can see this lead (never the project manager). */
async function canEdit(leadId: string | null) {
  const u = await currentUser();
  if (u.role === "pm") throw new Error("Not allowed");
  if (leadId && !(await getLead(leadId))) throw new Error("Not allowed");
  return u;
}

const ipOf = (h: Headers) => (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim() || h.get("x-real-ip") || "unknown";

/** "Generate contract" on an approved estimate: everything is copied in — customer, scope, price, payments. */
export async function generateContract(estimateId: string) {
  const e = await estimateById(estimateId);
  if (!e) throw new Error("Estimate not found.");
  const u = await canEdit(e.leadId);
  if (e.status !== "Approved") throw new Error("The customer has to approve the estimate first.");
  if (!(await contractsReady())) await migrate();
  const existing = await contractOfEstimate(e.id);
  if (existing) redirect(`/contracts/${existing.id}`);
  const rows = paymentRows(e.total, e.schedule);
  const addr = splitAddress(e.customer.address);
  const data: ContractData = {
    estimateId: e.id,
    estimateNumber: e.number,
    owner: { name: e.approvedName && e.approvedName.length > 2 ? e.approvedName : e.customer.name, street: addr.street, cityStateZip: addr.cityStateZip, phone: e.customer.phone, email: e.customer.email },
    workAddress: e.customer.address,
    lender: "None",
    title: e.title,
    sections: e.sections.map((s) => ({ title: s.title, items: s.items, price: s.price })),
    exclusions: e.exclusions,
    price: e.total,
    downPayment: depositFor(e.total),
    payments: rows.slice(1),
    commencement: "Start of demolition / site preparation",
    startDate: "",
    completionDate: "",
    allowances: "None",
  };
  const id = `C-${randomUUID().slice(0, 8)}`;
  await sql()`insert into contracts ${sql()({ id, estimate_id: e.id, lead_id: e.leadId, token: newContractToken(), data: sql().json(data), created_by: u.id })}`;
  if (e.leadId) await sql()`insert into lead_activity (lead_id, by_user, kind, text) values (${e.leadId}, ${u.id}, 'estimate', ${`Contract prepared from estimate #${e.number}`})`;
  redirect(`/contracts/${id}`);
}

/** The details Meidan fills or fixes before signing. Changing anything after he signed takes his signature off. */
export async function saveContractDetails(id: string, f: Record<string, string>): Promise<string> {
  const c = await contractById(id);
  if (!c) return "Failed: contract not found.";
  await canEdit(c.leadId);
  if (c.status === "Signed") return "Failed: already signed by the customer — it can't be changed.";
  const d: ContractData = {
    ...c.data,
    owner: { name: clean(f.ownerName, 120), street: clean(f.ownerStreet), cityStateZip: clean(f.ownerCity), phone: clean(f.ownerPhone, 40), email: clean(f.ownerEmail, 200) },
    workAddress: clean(f.workAddress),
    lender: clean(f.lender, 200) || "None",
    commencement: clean(f.commencement, 120),
    startDate: clean(f.startDate, 60),
    completionDate: clean(f.completionDate, 60),
    allowances: clean(f.allowances, 200) || "None",
    age65: f.age65 === "yes",
    arbitration: f.arbitration === "yes",
  };
  if (!d.owner.name) return "Failed: the owner's name is needed.";
  const changed = JSON.stringify(d) !== JSON.stringify(c.data);
  if (!changed) return "Saved ✓";
  await sql()`update contracts set data = ${sql().json(d)}, contractor_sign = null, status = 'Draft', updated_at = now() where id = ${id} and status <> 'Signed'`;
  revalidatePath("/", "layout");
  return c.contractor ? "Saved ✓ — sign again to send the new version" : "Saved ✓";
}

/** How customers pay — saved once, used in every contract email and on the signed copy. */
export async function savePayInstructions(text: string): Promise<string> {
  const u = await currentUser();
  if (u.role !== "admin" && u.role !== "office") return "Failed: not allowed.";
  const t = clean(text, 1500);
  await sql()`insert into app_settings (key, value) values ('pay_instructions', ${sql().json(t)}) on conflict (key) do update set value = excluded.value`;
  revalidatePath("/", "layout");
  return "Saved ✓";
}

/** Meidan signs first; then the customer's link works. */
export async function signAsContractor(id: string, name: string, agree: boolean): Promise<string> {
  const c = await contractById(id);
  if (!c) return "Failed: contract not found.";
  const u = await canEdit(c.leadId);
  if (u.role !== "admin") return "Failed: only Meidan signs contracts.";
  if (c.status === "Signed") return "Failed: already signed.";
  const who = clean(name, 120);
  if (who.length < 3) return "Failed: type your full name.";
  if (!agree) return "Failed: check the box to sign electronically.";
  if (!c.data.startDate || !c.data.completionDate || !c.data.commencement) return "Failed: fill the start date, completion date and what starts the work first.";
  const sign: ContractorSign = { name: who, initials: initialsOf(who), at: new Date().toISOString(), ip: ipOf(await headers()) };
  await sql()`update contracts set contractor_sign = ${sql().json(sign)}, status = 'Sent', updated_at = now() where id = ${id} and status <> 'Signed'`;
  revalidatePath("/", "layout");
  return "Done ✓ Signed — now send it";
}

/** The link went out (texted / copied / emailed). */
export async function contractSent(id: string): Promise<string> {
  const c = await contractById(id);
  if (!c) return "Failed: contract not found.";
  const u = await canEdit(c.leadId);
  if (!c.contractor) return "Failed: sign it first.";
  await sql()`update contracts set sent_at = coalesce(sent_at, now()) where id = ${id}`;
  if (c.leadId && !c.sentAt) await sql()`insert into lead_activity (lead_id, by_user, kind, text) values (${c.leadId}, ${u.id}, 'estimate', ${`Contract #${c.number} sent for signature — ${money(c.data.price)}`})`;
  revalidatePath("/", "layout");
  return "Done ✓";
}

export async function emailContract(id: string): Promise<string> {
  try {
    const c = await contractById(id);
    if (!c) return "Failed: contract not found.";
    await canEdit(c.leadId);
    if (!c.contractor) return "Failed: sign it first.";
    if (!emailReady()) return "Failed: email isn't connected yet — use Text for now.";
    if (!/^\S+@\S+\.\S+$/.test(c.data.owner.email)) return "Failed: add the customer's email first.";
    const h = await headers();
    const link = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/c/${c.token}`;
    const pay = await payInstructions();
    if (!pay) return "Failed: write how the customer pays the deposit first (box above).";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const d = c.data;
    const rows = [["Down payment — upon signing", d.downPayment], ...d.payments.map((p) => [p.name, p.amount] as const)]
      .map(([n, a]) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(String(n))}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${money(Number(a))}</td></tr>`)
      .join("");
    await sendEmail(
      d.owner.email,
      `Your contract from MD Golden Builders — ${d.title}`,
      `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1c1c1e;max-width:560px">
        <p>Hi ${esc(d.owner.name.split(" ")[0]!)},</p>
        <p>Thank you for approving the estimate! Your contract for <b>${esc(d.title)}</b> is ready, and I already signed it. All the details are filled in — you only need to review it and sign.</p>
        <p style="margin:24px 0"><a href="${link}" style="background:#d4a73a;color:#000;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:10px">Review & sign the contract</a></p>
        <h3 style="font-size:16px;margin:28px 0 6px">1. Sign (about 3 minutes)</h3>
        <p style="margin:0">The contract has 6 pages: the Home Improvement Contract (5 pages, including your Notice of Cancellation) and the Additional Description with the full scope of work. Read the pages, then type your name and tap Sign. You'll get your signed copy right away.</p>
        <h3 style="font-size:16px;margin:24px 0 6px">2. Pay the down payment — ${money(d.downPayment)}</h3>
        <p style="margin:0;white-space:pre-line">${esc(pay)}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#555">Please write "Contract ${c.number}" in the memo. By California law the down payment is never more than $1,000 or 10% of the price, whichever is less.</p>
        <h3 style="font-size:16px;margin:24px 0 6px">3. Payment schedule — ${money(d.price)} total</h3>
        <p style="margin:0 0 6px;font-size:13px;color:#555">Each progress payment is due only after that part of the work is done.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
        <h3 style="font-size:16px;margin:24px 0 6px">Your right to cancel</h3>
        <p style="margin:0">You can cancel within ${d.age65 ? "five" : "three"} business days after signing, without any penalty — see the Notice of Cancellation in the contract. We schedule the start after that period.</p>
        <p style="margin-top:24px">Any question at all, just reply here or text me.</p>
        <p>Meidan<br>MD Golden Builders · CSLB #1128874<br>(858) 933-1694</p>
      </div>`,
    );
    return contractSent(id).then((r) => (r.startsWith("Failed") ? r : "Done ✓ Emailed"));
  } catch (err) {
    return `Failed: ${(err as Error).message}`;
  }
}

/** Customer side (public, by private link): the only thing the customer does is sign — every detail is already filled. */
export async function signContract(token: string, input: { name: string }): Promise<string> {
  const c = await contractByToken(token);
  if (!c) return "This link isn't valid anymore.";
  if (c.status === "Signed") return "Already signed — thank you!";
  if (!c.contractor) return "This contract isn't ready yet.";
  const name = clean(input.name, 120);
  if (name.length < 3 || !/\s/.test(name)) return "Please type your full name (first and last).";
  const age65 = !!c.data.age65;
  const h = await headers();
  const now = new Date();
  const pt = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const owner: OwnerSign = {
    name,
    initials: initialsOf(name),
    age65,
    arbitration: !!c.data.arbitration,
    at: now.toISOString(),
    ip: ipOf(h),
    ua: clean(h.get("user-agent"), 400),
    cancelBy: cancelDeadline(new Date(Date.UTC(pt.getFullYear(), pt.getMonth(), pt.getDate())), age65 ? 5 : 3).toISOString(),
  };
  const hash = docHash(c.data, c.contractor, owner);
  const done = await sql().begin(async (tx) => {
    await tx`set local lock_timeout = '8s'`; await tx`set local statement_timeout = '20s'`; await tx`set local idle_in_transaction_session_timeout = '30s'`; // never leave the database locked
    const [r] = await tx`update contracts set owner_sign = ${tx.json(owner)}, status = 'Signed', signed_at = now(), doc_hash = ${hash}, updated_at = now()
                         where id = ${c.id} and status <> 'Signed' and contractor_sign is not null returning id`;
    if (!r) return false;
    if (c.leadId) {
      await tx`update leads set stage = 'Won', updated_at = now() where id = ${c.leadId}`;
      await tx`update follow_ups set done = true where lead_id = ${c.leadId} and not done`;
      await tx`insert into lead_activity (lead_id, by_user, kind, text) values (${c.leadId}, 'u-owner', 'estimate', ${`✍️ ${name} signed contract #${c.number} — ${money(c.data.price)}`})`;
    }
    return true;
  });
  if (!done) return "Already signed — thank you!";
  after(() => pushToTeam({ title: `✍️ ${name} signed contract #${c.number}`, body: `${c.data.title} · ${money(c.data.price)}`, url: `/contracts/${c.id}` }).catch((e) => console.error("sign notice failed", e)));
  revalidatePath("/", "layout");
  return "Done";
}
