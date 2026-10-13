import { Badge } from "./ui";
import type { ConfirmationStatus, LeadSource, LeadStage, LienWaiver, PaymentMilestone, ProjectStage, SubPayment } from "@/lib/types";

const stageTone: Record<LeadStage, Parameters<typeof Badge>[0]["tone"]> = {
  New: "info",
  "Trying to Reach": "warn",
  Talking: "ok",
  "Appointment Set": "gold",
  "Need to Send Estimate": "bad",
  "Estimate Sent": "warn",
  "Second Meeting": "gold",
  Won: "ok",
  Paused: "neutral",
  "No Response": "bad",
  "Not a Fit": "neutral",
  Lost: "neutral",
};
export const LeadStageBadge = ({ stage }: { stage: LeadStage }) => <Badge tone={stageTone[stage]}>{stage}</Badge>;

const sourceDot: Record<LeadSource, string> = {
  Google: "#4285F4",
  Yelp: "#D32323",
  Thumbtack: "#009FD9",
  Instagram: "#C13584",
  Facebook: "#1877F2",
  Referral: "#16a34a",
  Website: "#d09028",
  Other: "#8a8a8a",
};
export const SourceBadge = ({ source }: { source: LeadSource }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span className="size-2 rounded-full" style={{ background: sourceDot[source] }} />
    {source}
  </span>
);
export const sourceColor = (s: string) => sourceDot[s as LeadSource] ?? "#d09028";

const projectTone: Record<ProjectStage, Parameters<typeof Badge>[0]["tone"]> = {
  "Contract Signed": "info",
  "Waiting on Permit": "warn",
  Scheduled: "info",
  "In Progress": "gold",
  "Final Inspection": "gold",
  "Punch List": "warn",
  Completed: "ok",
};
export const ProjectStageBadge = ({ stage }: { stage: ProjectStage }) => <Badge tone={projectTone[stage]}>{stage}</Badge>;

export const PayStatusBadge = ({ status }: { status: PaymentMilestone["status"] | SubPayment["status"] }) => (
  <Badge tone={status === "Paid" ? "ok" : status === "Invoiced" ? "gold" : status === "Overdue" || status === "Requested" ? "bad" : "neutral"}>{status === "Invoiced" ? "Payment requested" : status}</Badge>
);

export const WaiverBadge = ({ w }: { w: LienWaiver }) =>
  w === "N/A" ? <span className="text-xs text-muted">—</span> : <Badge tone={w === "Unconditional received" ? "ok" : w === "Conditional received" ? "warn" : "bad"}>{w}</Badge>;

export const ConfirmBadge = ({ c }: { c: ConfirmationStatus }) => (
  <Badge tone={c === "Confirmed" ? "ok" : c === "No response" ? "bad" : c === "Awaiting reply" ? "warn" : "neutral"}>
    {c === "Confirmed" ? "✓ Confirmed" : c}
  </Badge>
);
