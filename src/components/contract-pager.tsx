"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

/** One contract page at a time — "Page 2 of 6" with back / next and a chip per page. Printing shows every page. */
export function ContractPager({ pages, labels, todo }: { pages: React.ReactNode[]; labels: string[]; todo?: boolean[] }) {
  const [i, setI] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const n = pages.length;
  const go = (k: number) => {
    setI(Math.max(0, Math.min(n - 1, k)));
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const nav = (where: "top" | "bottom") => (
    <div className={`mx-auto flex max-w-[820px] items-center gap-2 print:hidden ${where === "top" ? "sticky top-0 z-10 border-b border-[#e3ddd0] bg-[#f4f1ea]/95 py-2 backdrop-blur" : "py-3"}`}>
      <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="inline-flex items-center gap-1 border border-[#1c1c1c] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-30"><ChevronLeft className="size-4" /> Back</button>
      <div className="min-w-0 flex-1 text-center">
        <div className="text-sm font-bold text-[#1c1c1c]">Page {i + 1} of {n}</div>
        <div className="truncate text-[11px] text-[#666]">{labels[i]}</div>
      </div>
      <button type="button" onClick={() => go(i + 1)} disabled={i === n - 1} className="inline-flex items-center gap-1 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-30">Next <ChevronRight className="size-4" /></button>
    </div>
  );
  return (
    <div ref={top} className="scroll-mt-0">
      {nav("top")}
      <div className="mx-auto mb-3 mt-2 flex max-w-[820px] justify-center gap-1.5 print:hidden">
        {pages.map((_, k) => (
          <button key={k} type="button" onClick={() => go(k)} aria-label={`Page ${k + 1}`} className={`relative size-9 border text-xs font-bold ${k === i ? "border-[#1c1c1c] bg-[#1c1c1c] text-white" : "border-[#c9c2b3] bg-white text-[#1c1c1c]"}`}>
            {k + 1}/{n}
            {todo?.[k] && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#f5c542] ring-1 ring-[#b8902f]" title="You sign on this page" />}
          </button>
        ))}
      </div>
      {pages.map((p, k) => (
        <div key={k} className={`${k === i ? "" : "hidden"} print:block`}>
          {p}
          <div className="mx-auto mt-1 max-w-[820px] text-center text-[11px] text-[#777] print:hidden">Page {k + 1} of {n}</div>
        </div>
      ))}
      {nav("bottom")}
    </div>
  );
}
