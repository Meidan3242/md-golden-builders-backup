import { NextResponse } from "next/server";
import { canSeeAll, currentUser, getLead } from "@/lib/data";
import { estimateById } from "@/lib/estimates";
import { estimatePdf, pdfName } from "@/pdf/estimate-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The estimate's PDF for the team (drafts too) — ?download=1 saves it, otherwise it opens to look at. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const e = user.role === "pm" ? null : await estimateById(id);
  if (!e || (e.leadId ? !(await getLead(e.leadId)) : !canSeeAll(user))) return new NextResponse("Not found", { status: 404 });
  const pdf = await estimatePdf(e);
  const how = new URL(req.url).searchParams.has("download") ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `${how}; filename="${pdfName(e)}"`, "Cache-Control": "private, no-store" },
  });
}
