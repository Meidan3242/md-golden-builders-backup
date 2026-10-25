import "server-only";
import { migrate, schemaVersion, sql } from "./db";
import type { Estimate } from "./estimates";
import { money } from "./format";
import { pushToTeam } from "./push";

const nth = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

/** The customer opened their estimate: count it; notify the team (at most once every 30 minutes per estimate). */
export async function customerOpened(e: Estimate) {
  if (((await schemaVersion()) ?? 0) < 9) await migrate();
  const [r] = await sql()`update estimates set open_count = open_count + 1, last_opened_at = now() where id = ${e.id} returning open_count`;
  const [due] = await sql()`update estimates set notified_at = now() where id = ${e.id} and (notified_at is null or notified_at < now() - interval '30 minutes') returning id`;
  if (!due) return;
  const n = Number(r.open_count);
  const name = e.customer.name;
  const text = n === 1 ? `👀 ${name} opened estimate #${e.number}` : `👀 ${name} opened estimate #${e.number} again (${nth(n)} time)`;
  if (e.leadId) await sql()`insert into lead_activity (lead_id, by_user, kind, text) values (${e.leadId}, 'u-owner', 'estimate', ${text})`;
  await pushToTeam({ title: text, body: `${e.title} · ${money(e.total)}`, url: `/estimates/${e.id}` });
}

export async function customerApproved(e: Estimate, who: string) {
  await pushToTeam({ title: `✅ ${who} approved estimate #${e.number}`, body: `${e.title} · ${money(e.total)} — time to send the contract.`, url: `/estimates/${e.id}` });
}
