import { NextResponse } from "next/server";
import { currentUser } from "@/lib/data";
import { PHOTO_ID } from "@/lib/estimates";
import { signedUrl } from "@/lib/storage";

/** An estimate item photo for the team (editor and preview) — through a 10-minute private link. */
export async function GET(_: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const u = await currentUser();
  if (u.role === "pm" || !PHOTO_ID.test(pid)) return new NextResponse("Not found", { status: 404 });
  const url = await signedUrl("estimates", `r2:${pid}`);
  return url ? NextResponse.redirect(url) : new NextResponse("Photo unavailable", { status: 404 });
}
