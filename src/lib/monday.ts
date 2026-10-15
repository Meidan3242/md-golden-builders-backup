import "server-only";

// monday.com is read only from the server, with a token kept in Vercel (MONDAY_API_TOKEN) — never in browser code.
export const mondayReady = () => !!process.env.MONDAY_API_TOKEN;

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(process.env.MONDAY_API_URL ?? "https://api.monday.com/v2", {
    method: "POST",
    headers: { Authorization: process.env.MONDAY_API_TOKEN!, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[]; error_message?: string };
  if (!res.ok || json.errors || json.error_message) throw new Error(json.errors?.[0]?.message ?? json.error_message ?? `monday ${res.status}`);
  return json.data!;
}

export type MondayItem = { id: string; name: string; created_at: string; group: { title: string }; cols: Record<string, string> };

type Page = { cursor: string | null; items: { id: string; name: string; created_at: string; group: { title: string }; column_values: { text: string | null; column: { title: string } }[] }[] };
const FIELDS = "cursor items { id name created_at group { title } column_values { text column { title } } }";

/** Every item on a board, with its column values keyed by column title. */
export async function boardItems(boardId: string): Promise<{ board: string; items: MondayItem[] }> {
  const first = await gql<{ boards: { name: string; items_page: Page }[] }>(
    `query ($id: [ID!]) { boards(ids: $id) { name items_page(limit: 500) { ${FIELDS} } } }`,
    { id: [boardId] },
  );
  const board = first.boards[0];
  if (!board) throw new Error("Board not found");
  const pages = [board.items_page];
  let cursor = board.items_page.cursor;
  while (cursor) {
    const next = await gql<{ next_items_page: Page }>(`query ($c: String!) { next_items_page(limit: 500, cursor: $c) { ${FIELDS} } }`, { c: cursor });
    pages.push(next.next_items_page);
    cursor = next.next_items_page.cursor;
  }
  return {
    board: board.name,
    items: pages.flatMap((p) => p.items).map((i) => ({
      id: i.id,
      name: i.name,
      created_at: i.created_at,
      group: i.group,
      cols: Object.fromEntries(i.column_values.map((c) => [c.column.title.trim().toLowerCase(), (c.text ?? "").trim()])),
    })),
  };
}

/** Every board in the account with its group titles (to find the per-client boards). */
export async function allBoards(): Promise<{ id: string; name: string; groups: string[] }[]> {
  const out: { id: string; name: string; groups: string[] }[] = [];
  for (let page = 1; page < 50; page++) {
    const d = await gql<{ boards: { id: string; name: string; groups: { title: string }[] }[] }>(
      `query ($p: Int!) { boards(limit: 100, page: $p, state: active) { id name groups { title } } }`,
      { p: page },
    );
    out.push(...d.boards.map((b) => ({ id: b.id, name: b.name, groups: b.groups.map((g) => g.title.trim().toLowerCase()) })));
    if (d.boards.length < 100) break;
  }
  return out;
}

export type ClientRow = { id: string; name: string; group: string; cols: Record<string, string>; subs: { name: string; cols: Record<string, string> }[] };

/** Items (and their subitems) of several client boards at once. */
export async function clientBoards(ids: string[]): Promise<Record<string, ClientRow[]>> {
  const cv = "column_values { text column { title } }";
  const d = await gql<{ boards: { id: string; items_page: { items: { id: string; name: string; group: { title: string }; column_values: { text: string | null; column: { title: string } }[]; subitems: { name: string; column_values: { text: string | null; column: { title: string } }[] }[] }[] } }[] }>(
    `query ($ids: [ID!]) { boards(ids: $ids) { id items_page(limit: 500) { items { id name group { title } ${cv} subitems { name ${cv} } } } } }`,
    { ids },
  );
  const cols = (xs: { text: string | null; column: { title: string } }[]) => Object.fromEntries(xs.map((c) => [c.column.title.trim().toLowerCase(), (c.text ?? "").trim()]));
  return Object.fromEntries(
    d.boards.map((b) => [
      b.id,
      b.items_page.items.map((i) => ({ id: i.id, name: i.name, group: i.group.title.trim().toLowerCase(), cols: cols(i.column_values), subs: (i.subitems ?? []).map((s) => ({ name: s.name, cols: cols(s.column_values) })) })),
    ]),
  );
}
