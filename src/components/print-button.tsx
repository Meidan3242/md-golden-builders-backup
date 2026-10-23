"use client";

import { Download } from "lucide-react";

/** Saves the page as a PDF (the phone's / computer's own Print → Save as PDF). */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1c1c1c] print:hidden">
      <Download className="size-3.5" /> Download PDF
    </button>
  );
}
