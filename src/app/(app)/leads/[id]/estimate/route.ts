import { NextResponse } from "next/server";
import { getLead } from "@/lib/data";
import { signedUrl } from "@/lib/storage";

/** Opens the lead's estimate PDF through a 10-minute private link (login required by middleware). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead?.estimatePdf) return new NextResponse("No PDF", { status: 404 });
  const url = await signedUrl("estimates", lead.estimatePdf);
  return url ? NextResponse.redirect(url) : new NextResponse("File unavailable", { status: 404 });
}
