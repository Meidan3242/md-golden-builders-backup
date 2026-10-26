import { describe, expect, it } from "vitest";
import { projectChecklist } from "@/lib/project-checklist";
import type { Project } from "@/lib/types";

const base = { documents: [], permits: [], media: [], subs: [], stage: "Completed" } as unknown as Project;
const state = (p: Project, label: string) => projectChecklist(p).find((x) => x.label.startsWith(label))!.state;

describe("project checklist: ✓ only with proof", () => {
  it("never claims the welcome email or warranty links were sent (not tracked)", () => {
    expect(state(base, "Welcome email")).toBe("untracked");
    expect(state(base, "Warranty")).toBe("untracked"); // even on a Completed project
  });
  it("no permits or subcontractors entered → not tracked, not ✓", () => {
    expect(state(base, "Permit approved")).toBe("untracked");
    expect(state(base, "All subcontractor")).toBe("untracked");
  });
  it("permits and subcontractor agreements are ✓ only when they really are", () => {
    const p = { ...base, permits: [{ status: "Submitted" }], subs: [{ agreement: "Sent" }] } as unknown as Project;
    expect(state(p, "Permit approved")).toBe("todo");
    expect(state(p, "All subcontractor")).toBe("todo");
    const q = { ...base, permits: [{ status: "Approved" }], subs: [{ agreement: "Signed" }] } as unknown as Project;
    expect(state(q, "Permit approved")).toBe("done");
    expect(state(q, "All subcontractor")).toBe("done");
  });
  it("documents and photos still count", () => {
    const p = { ...base, documents: [{ kind: "Contract" }], media: [{ phase: "Before" }] } as unknown as Project;
    expect(state(p, "Contract signed")).toBe("done");
    expect(state(p, "Before photos")).toBe("done");
    expect(state(base, "Contract signed")).toBe("todo");
  });
});
