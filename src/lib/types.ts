// Domain model. Mirrors the future database schema (Supabase/Postgres).

export type Role = "admin" | "office" | "sales" | "pm";

export interface User {
  id: string;
  name: string;
  role: Role;
  initials: string;
  title: string;
}

export const LEAD_SOURCES = [
  "Google",
  "Yelp",
  "Thumbtack",
  "Instagram",
  "Facebook",
  "Referral",
  "Website",
  "Other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STAGES = [
  "New",
  "Trying to Reach",
  "Talking",
  "Appointment Set",
  "Need to Send Estimate",
  "Estimate Sent",
  "Second Meeting",
  "Won",
  "Paused",
  "No Response",
  "Not a Fit",
  "Lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Stages shown as columns on the pipeline board (closed stages live in filters). */
export const PIPELINE_STAGES: LeadStage[] = [
  "New",
  "Trying to Reach",
  "Appointment Set",
  "Need to Send Estimate",
  "Estimate Sent",
  "Second Meeting",
];

/** First-contact rules: attempts until scheduled; no reply after 7 days → "No Response". */
export const MAX_ATTEMPTS = 5;
export const RELEASE_AFTER_DAYS = 7;

export interface ThreadMessage {
  at: string;
  from: "customer" | "us" | "robot";
  channel: "Text" | "Thumbtack" | "Yelp" | "Email" | "Call";
  text: string;
}

export interface CallRecording {
  id: string;
  at: string; // ISO
  direction: "Inbound" | "Outbound";
  durationSec: number;
  by: string; // user id
  summary?: string;
}

export interface Activity {
  id: string;
  at: string;
  by: string;
  kind: "note" | "call" | "sms" | "email" | "stage" | "estimate" | "appointment" | "payment" | "file";
  text: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  service: string;
  source: LeadSource;
  stage: LeadStage;
  createdAt: string;
  assignedTo: string;
  estimateAmount?: number;
  estimateSentAt?: string;
  estimateViewedAt?: string;
  lostReason?: string;
  projectId?: string;
  notes?: string;
  calls: CallRecording[];
  activity: Activity[];
  attempts?: number;
  thread?: ThreadMessage[];
  lat?: number;
  lng?: number;
  /** Tapped ✓ in the weekly list (meeting booked / done). */
  closedAt?: string;
  estimatePdf?: string;
}

export type ConfirmationStatus = "Confirmed" | "Awaiting reply" | "Reminder scheduled" | "No response";

export interface Appointment {
  id: string;
  leadId?: string;
  projectId?: string;
  title: string;
  type: "Site Visit" | "Second Meeting" | "Project Meeting" | "Inspection";
  start: string;
  durationMin: number;
  assignedTo: string;
  confirmation: ConfirmationStatus;
}

export interface FollowUp {
  id: string;
  leadId: string;
  due: string;
  step: string; // "Day 1", "Day 3"...
  action: string;
  assignedTo: string;
  done: boolean;
}

export const PROJECT_STAGES = [
  "Contract Signed",
  "Waiting on Permit",
  "Scheduled",
  "In Progress",
  "Final Inspection",
  "Punch List",
  "Completed",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number] | "Cancelled";

export type PayMethod = "Square (card)" | "ACH" | "Zelle" | "Check" | "Cash" | "Venmo";

export interface PaymentMilestone {
  id: string;
  name: string;
  amount: number;
  status: "Paid" | "Invoiced" | "Upcoming" | "Overdue";
  dueDate?: string;
  paidAt?: string;
  method?: PayMethod;
  reference?: string;
  /** false = no receipt was sent (e.g. imported from monday). */
  receiptSent?: boolean;
}

export type LienWaiver = "Unconditional received" | "Conditional received" | "Missing" | "N/A";

export interface SubPayment {
  id: string;
  name: string;
  amount: number;
  status: "Paid" | "Requested" | "Upcoming";
  paidAt?: string;
  method?: PayMethod;
  reference?: string;
  proof: boolean;
  lienWaiver: LienWaiver;
}

export interface SubAssignment {
  id: string;
  subId: string;
  scope: string;
  amount: number;
  agreement: "Signed" | "Sent" | "Not sent";
  payments: SubPayment[];
}

export interface Expense {
  id: string;
  date: string;
  vendor: string;
  category: "Materials" | "Equipment rental" | "Dump / haul" | "Permit fees" | "Design / engineering" | "Other";
  amount: number;
  receipt: boolean;
  by: string;
  /** From monday: still owed to the sub / vendor. */
  pending?: boolean;
  /** Photo of the receipt (real file). */
  receiptHref?: string;
}

export interface ChangeOrder {
  id: string;
  number: number;
  title: string;
  amount: number;
  status: "Draft" | "Sent" | "Signed";
  signedAt?: string;
  milestones: PaymentMilestone[];
  subs: SubAssignment[];
  expenses: Expense[];
}

export interface Permit {
  id: string;
  jurisdiction: "City of San Diego" | "County of San Diego" | "Chula Vista" | "Carlsbad" | "Other";
  number?: string;
  type: string;
  status: "Plans in design" | "Submitted" | "Corrections" | "Approved" | "Finaled";
  submittedAt?: string;
  approvedAt?: string;
  fee?: number;
  inspections: { name: string; date?: string; result?: "Passed" | "Failed" | "Scheduled" }[];
}

export interface MediaItem {
  id: string;
  phase: "Before" | "During" | "After" | "From monday";
  kind: "photo" | "video";
  /** Real file: opens through /files/<id> (private, login required). */
  src?: string;
  caption: string;
  at: string;
  hue: number; // placeholder thumbnail colour in the demo
}

export interface ProjectDoc {
  id: string;
  name: string;
  kind: "Contract" | "Additional Description" | "Change Order" | "Estimate" | "Plans" | "Permit" | "Completion Form" | "Lien Waiver" | "Other";
  at: string;
  signed?: boolean;
  /** Real file: opens through /files/<id>. */
  href?: string;
}

export interface Project {
  id: string;
  /** Map pin (from the address). */
  lat?: number;
  lng?: number;
  leadId: string;
  number: string;
  customer: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  type: string;
  stage: ProjectStage;
  assignedTo: string;
  contractValue: number;
  signedAt: string;
  startDate?: string;
  targetCompletion?: string;
  warrantyYears?: 1 | 5;
  milestones: PaymentMilestone[];
  changeOrders: ChangeOrder[];
  subs: SubAssignment[];
  expenses: Expense[];
  permits: Permit[];
  media: MediaItem[];
  documents: ProjectDoc[];
  activity: Activity[];
  chat?: ChatMessage[];
  /** monday status was "Stuck". */
  stuck?: boolean;
  /** Where the record came from (e.g. "monday · Clients 2026"). */
  origin?: string;
  sale?: number;
  cost?: number;
}

/** What the smart-capture assistant understood from a chat message. */
export interface CaptureResult {
  kind: "Customer payment" | "Sub payment" | "Expense" | "Document" | "Photos" | "Task";
  fields: [string, string][];
  destination: string; // where it was filed, e.g. "Payments › Contract #2"
  status: "Saved" | "Needs confirmation";
}

export interface ChatMessage {
  id: string;
  at: string;
  by: string;
  text: string;
  attachment?: { name: string; kind: "image" | "pdf" | "video" };
  capture?: CaptureResult;
  /** Assistant reply: an answer, or a draft that waits for one-tap approval. */
  reply?: { title: string; body: string[]; channel?: string; actions?: string[]; done?: string };
}

export interface Subcontractor {
  id: string;
  name: string;
  company: string;
  trade: string;
  phone: string;
  email?: string;
  licenseNo?: string;
  insuranceExpires?: string;
  w9: boolean;
  preferredMethod: PayMethod;
}

export interface MarketingSpend {
  month: string; // YYYY-MM
  source: LeadSource | "Marketing manager";
  amount: number;
}
