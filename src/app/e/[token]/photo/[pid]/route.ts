import { NextResponse } from "next/server";
import { estimateByToken, PHOTO_ID } from "@/lib/estimates";
import { signedUrl } from "@/lib/storage";

/** A photo on the customer's estimate — only one that belongs to the estimate behind this private link. */
export async function GET(_: Request, { params }: { params: Promise<{ token: string; pid: string }> }) {
  const { token, pid } = await params;
  const e = PHOTO_ID.test(pid) ? await estimateByToken(token) : null;
  if (!e?.sections.some((s) => s.photos?.includes(pid))) return new NextResponse("Not found", { status: 404 });
  const url = await signedUrl("estimates", `r2:${pid}`);
  return url ? NextResponse.redirect(url) : new NextResponse("Photo unavailable", { status: 404 });
}
