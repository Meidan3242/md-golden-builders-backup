import { NextResponse } from "next/server";
import { getProject } from "@/lib/data";
import { schemaVersion, sql } from "@/lib/db";
import { signedUrl } from "@/lib/storage";

/** Opens a project file (photo, PDF, receipt) through a 10-minute private link — only for people who can see that project. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (((await schemaVersion()) ?? 0) < 5) return new NextResponse("Not found", { status: 404 });
  const [f] = await sql()`select project_id, path from project_files where id = ${id}`;
  if (!f || !(await getProject(f.project_id))) return new NextResponse("Not found", { status: 404 });
  const url = await signedUrl("projects", f.path);
  return url ? NextResponse.redirect(url) : new NextResponse("File unavailable", { status: 404 });
}
