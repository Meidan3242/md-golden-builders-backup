import "server-only";
import { sql } from "./db";
import { allBoards, boardItems, clientBoards, type ClientRow, type MondayItem } from "./monday";

export const CLIENT_BOARDS = [
  { id: "18393481732", label: "Clients 2026" },
  { id: "9084832949", label: "Clients 2025" },
];

/** "✅ - Kim Hyeonsok (google) (copy)" → "kim hyeonsok" — used to match a client to its own board. */
const norm = (s: string) =>
  s.toLowerCase().replace(/✅/g, "").replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9א-ת]+/g, " ").replace(/\s+/g, " ").trim();
const cleanName = (s: string) => s.replace(/✅\s*-?\s*/g, "").replace(/\s*\([^)]*\)/g, "").trim() || s.trim();
const money = (s?: string) => {
  const n = Number((s ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n !== 0 ? n : 0;
};
const day = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(`${s.slice(0, 10)}T19:00:00Z`) : null);
const city = (address: string) => address.match(/,\s*([A-Za-z .'-]+?)\s*,?\s*CA\b/i)?.[1]?.trim() ?? "";
const MATERIAL = /home ?depot|lowe|material|floor ?& ?dec|vanity|faucet|cabinet|counter|tile shop|supply|lumber/i;

/** A payment / expense row may hold its real lines in subitems ("Multiple payment"). */
const lines = (r: ClientRow) =>
  r.subs.length && r.subs.some((s) => money(s.cols["total price"])) ? r.subs.map((s) => ({ name: s.name || r.name, cols: s.cols })) : [{ name: r.name, cols: r.cols }];

type Built = {
  project: Record<string, unknown>;
  contracts: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
};

function build(id: string, item: MondayItem | null, board: { id: string; name: string } | null, rows: ClientRow[], origin: string): Built {
  const c = item?.cols ?? {};
  const status = (c["status"] ?? "").toLowerCase();
  const done = board?.name.includes("✅");
  const stage = status === "done" || (!item && done) ? "Completed" : status === "cancel" ? "Cancelled" : "In Progress";
  const service = (c["requested service"] ?? "").split("\n").map((x) => x.replace(/^lead( summary)?:?\s*/i, "").trim()).find(Boolean) ?? "";
  const address = c["property address"] ?? "";

  const contracts: Record<string, unknown>[] = [];
  const payments: Record<string, unknown>[] = [];
  const expenses: Record<string, unknown>[] = [];
  let nextN = 2;
  for (const r of rows.filter((x) => x.group === "contract")) {
    const co = r.name.match(/change\s*order\s*#?\s*(\d+)/i);
    const n = /^contract/i.test(r.name) && !contracts.some((x) => x.n === 1) ? 1 : co ? Number(co[1]) + 1 : nextN;
    nextN = Math.max(nextN, n + 1);
    contracts.push({ id: `${id}-c${n}`, project_id: id, n, title: r.name, amount: money(r.cols["total price"]), signed_at: day(r.cols["date"]), status: "Signed" });
  }
  rows.filter((x) => x.group === "payment").flatMap(lines).forEach((l, i) => {
    const st = (l.cols["status"] ?? "").toLowerCase();
    payments.push({
      id: `${id}-p${i}`, project_id: id, contract_n: null, name: l.name, amount: money(l.cols["total price"]),
      paid_at: day(l.cols["date"]), method: l.cols["payment method"] || null,
      status: st.startsWith("pending") ? "Upcoming" : st.startsWith("mailed") ? "Invoiced" : "Paid",
    });
  });
  rows.filter((x) => x.group === "expenses").flatMap(lines).forEach((l, i) => {
    expenses.push({
      id: `${id}-e${i}`, project_id: id, contract_n: null, vendor: l.name, amount: money(l.cols["total price"]),
      spent_at: day(l.cols["date"]), pending: (l.cols["status"] ?? "").toLowerCase().startsWith("pending"),
      category: MATERIAL.test(l.name) ? "Materials" : "Other",
    });
  });

  const sale = money(c["sale"]);
  const cost = money(c["cost"]);
  if (!contracts.some((x) => x.n === 1)) {
    const coTotal = contracts.reduce((a, x) => a + Number(x.amount), 0);
    contracts.push({ id: `${id}-c1`, project_id: id, n: 1, title: "Contract", amount: Math.max(0, sale - coTotal) || sale, signed_at: null, status: "Signed" });
  }
  if (!expenses.length && cost) expenses.push({ id: `${id}-e0`, project_id: id, contract_n: null, vendor: "Total cost (from monday)", amount: cost, spent_at: null, pending: false, category: "Other" });

  const dates = [...contracts.map((x) => x.signed_at), ...payments.map((x) => x.paid_at)].filter(Boolean) as Date[];
  const created = item ? new Date(item.created_at) : new Date();
  const signed = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : created;

  return {
    project: {
      id, monday_id: item?.id ?? null, monday_board_id: board?.id ?? null,
      customer: cleanName(item?.name ?? board?.name ?? "Client"), phone: "", email: null, address, city: city(address),
      type: service ? (service.length > 50 ? `${service.slice(0, 47)}…` : service) : "Project",
      stage, stuck: status === "stuck", sale: sale || null, cost: cost || null, signed_at: signed, origin,
    },
    contracts, payments, expenses,
  };
}

/** Bring every client (2026 + 2025) and their own boards (contracts, payments, expenses) into the app. Safe to run again. */
export async function importClients() {
  const boards = await allBoards();
  const clientBoardList = boards.filter((b) => b.groups.includes("payment") && b.groups.includes("expenses"));
  const used = new Set<string>();
  const items: { item: MondayItem; origin: string }[] = [];
  for (const cb of CLIENT_BOARDS) {
    const { items: its } = await boardItems(cb.id);
    items.push(...its.map((item) => ({ item, origin: `monday · ${cb.label}` })));
  }
  const match = (name: string) => {
    const n = norm(name);
    if (n.length < 3) return null;
    return clientBoardList.find((b) => !used.has(b.id) && norm(b.name) === n) ?? clientBoardList.find((b) => !used.has(b.id) && norm(b.name).length >= 5 && (norm(b.name).includes(n) || n.includes(norm(b.name))));
  };
  const pairs = items.map(({ item, origin }) => {
    const b = match(item.name);
    if (b) used.add(b.id);
    return { id: `PJ-${item.id}`, item, board: b ?? null, origin };
  });
  // Client boards with no row on a Clients board still become projects.
  for (const b of clientBoardList.filter((x) => !used.has(x.id))) pairs.push({ id: `PJ-B${b.id}`, item: null as unknown as MondayItem, board: b, origin: "monday · client board" });

  const boardIds = pairs.flatMap((p) => (p.board ? [p.board.id] : []));
  const data: Record<string, ClientRow[]> = {};
  for (let i = 0; i < boardIds.length; i += 10) Object.assign(data, await clientBoards(boardIds.slice(i, i + 10)));

  const built = pairs.map((p) => build(p.id, p.item, p.board, p.board ? data[p.board.id] ?? [] : [], p.origin));
  const db = sql();
  await db.begin(async (tx) => {
    const projects = built.map((b) => b.project);
    for (let i = 0; i < projects.length; i += 100) {
      await tx`insert into projects ${tx(projects.slice(i, i + 100))}
               on conflict (id) do update set customer = excluded.customer, address = excluded.address, city = excluded.city, type = excluded.type,
                 stage = excluded.stage, stuck = excluded.stuck, sale = excluded.sale, cost = excluded.cost, signed_at = excluded.signed_at,
                 monday_board_id = excluded.monday_board_id, origin = excluded.origin, updated_at = now()`;
    }
    const ids = projects.map((p) => p.id as string);
    if (!ids.length) return;
    await tx`delete from project_contracts where project_id in ${tx(ids)}`;
    await tx`delete from project_payments where project_id in ${tx(ids)}`;
    await tx`delete from project_expenses where project_id in ${tx(ids)} and source = 'monday'`; // keep expenses added in the app
    for (const [table, rows] of [["project_contracts", built.flatMap((b) => b.contracts)], ["project_payments", built.flatMap((b) => b.payments)], ["project_expenses", built.flatMap((b) => b.expenses)]] as const) {
      for (let i = 0; i < rows.length; i += 300) await tx`insert into ${tx(table)} ${tx(rows.slice(i, i + 300))}`;
    }
  });
  const by = (s: string) => built.filter((b) => b.project.stage === s).length;
  return `${built.length} projects (${by("In Progress")} ongoing, ${by("Completed")} completed, ${by("Cancelled")} cancelled) · ${pairs.filter((p) => p.board).length} with their own board · ${built.reduce((a, b) => a + b.payments.length, 0)} payments · ${built.reduce((a, b) => a + b.expenses.length, 0)} expenses`;
}
