import { NextResponse } from "next/server";
import { estimateByToken } from "@/lib/estimates";
import { estimatePdf, pdfName } from "@/pdf/estimate-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The customer's estimate as a PDF — only by their private link, never a draft. */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const e = await estimateByToken(token);
  if (!e) return new NextResponse("Not found", { status: 404 });
  const pdf = await estimatePdf(e);
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${pdfName(e)}"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
