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
