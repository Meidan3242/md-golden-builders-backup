import type { Project } from "./types";

// The project checklist only shows ✓ when the app has proof. Things the app doesn't record yet
// (the welcome email, warranty links) or has nothing to check (no permits / subs entered) say so instead.
export type CheckState = "done" | "todo" | "untracked";
export type CheckItem = { label: string; state: CheckState; note?: string };

export function projectChecklist(p: Project): CheckItem[] {
  const has = (k: string) => p.documents.some((d) => d.kind === k);
  const item = (label: string, done: boolean): CheckItem => ({ label, state: done ? "done" : "todo" });
  return [
    item("Contract signed (Form 203 + Additional Description)", has("Contract")),
    { label: "Welcome email sent (contract, scope, license, payments)", state: "untracked", note: "not tracked in the app yet" },
    p.permits.length === 0
      ? { label: "Permit approved", state: "untracked", note: "no permits entered" }
      : item("Permit approved", p.permits.some((x) => x.status === "Approved" || x.status === "Finaled")),
    item("Before photos uploaded", p.media.some((m) => m.phase === "Before")),
    p.subs.length === 0
      ? { label: "All subcontractor agreements signed", state: "untracked", note: "no subcontractors entered" }
      : item("All subcontractor agreements signed", p.subs.every((s) => s.agreement === "Signed")),
    item("Completion form signed", has("Completion Form")),
    { label: "Warranty + review links sent", state: "untracked", note: "not tracked in the app yet" },
  ];
}
