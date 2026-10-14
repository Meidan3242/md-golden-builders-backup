// Demo estimate + contract signing data for the customer-facing pages (fictional customer).

export const COMPANY = {
  name: "MD Golden Builders",
  license: "CSLB #1128874",
  address: "4275 Mission Bay Dr #359, San Diego, CA 92109",
  phone: "(858) 933-1694",
  email: "info@mdgoldenbuilders.com",
  web: "www.mdgoldenbuilders.com",
  // Placeholders — real payment details are never put on a public page.
  zelle: "payments@example.com",
  venmo: "https://example.com/venmo-placeholder",
  reviews: { google: "https://tr.ee/xLG1j2NoRY", yelp: "https://tr.ee/ffZ0n6Xp5-", thumbtack: "https://tr.ee/kiBOFNYW8q" },
};

export const DEMO_ESTIMATE = {
  number: 556,
  date: "Oct 10, 2026",
  validUntil: "Nov 9, 2026",
  customer: { name: "Rachel Donovan", first: "Rachel", address: "100 Example Way, La Jolla, CA 92037", phone: "(858) 555-1851" },
  title: "New retaining wall — 95 LF CMU with stucco finish",
  note: "Thanks for walking the property with me on Tuesday. Below is everything we discussed — the wall, the drainage, and the finish. Any question, just text me.",
  sections: [
    { title: "Demolition & site preparation", items: ["Demolish and remove the existing walls in the work area", "Excavate for new footings per the approved structural plans", "Haul away debris and excess soil", "Grade and prepare the work area"] },
    { title: "Concrete footings", items: ["Reinforced concrete footings per plans and code", "Formwork, rebar, concrete placement and finishing", "Coordinate and pass the City footing inspection"] },
    { title: "CMU retaining wall", items: ["Build approx. 95 linear feet of block wall", "Rebar, grout and structural components per plans", "Inspections throughout construction"] },
    { title: "Stucco finish", items: ["Prepare block surface", "3-coat stucco system, smooth finish", "Clean, uniform final appearance"] },
  ],
  exclusions: ["New electrical or plumbing", "Flooring / new floor area (remains soil)", "Permit and engineering fees (billed at cost)"],
  base: 85760,
  schedule: [
    { name: "Deposit (on signing)", pct: null as number | null, amount: 1000 },
    { name: "Upon start of demo", pct: 0.4 },
    { name: "Upon installation of footings", pct: 0.4 },
    { name: "Upon stucco installation", pct: 0.1 },
    { name: "Project completion", pct: 0.1 },
  ],
  warranty: "5-year workmanship warranty",
};

// Signature / initial spots on the owner's Form 203 (page coords in % of the page),
// plus our own generated Additional Description pages.
export type SignField = {
  id: string;
  page: number;
  label: string;
  who: "Owner" | "Contractor" | "Second owner";
  kind: "Signature" | "Initials" | "Date" | "Choice";
  x: number;
  y: number;
  w: number;
  optional?: string;
  done?: boolean;
};

const P = (x: number, y: number) => ({ x: (x / 612) * 100, y: (y / 1008) * 100 });

export const SIGN_FIELDS: SignField[] = [
  { id: "f1", page: 1, label: "Received a completed copy of this agreement", who: "Owner", kind: "Initials", ...P(488, 751), w: 11 },
  { id: "f2", page: 1, label: "Age affirmation (65+ gets a 5-day right to cancel)", who: "Owner", kind: "Initials", ...P(302, 766), w: 11 },
  { id: "f3", page: 1, label: "Notice of Right to Cancel — received", who: "Owner", kind: "Initials", ...P(38, 798), w: 6 },
  { id: "f4", page: 1, label: "Arbitration of disputes", who: "Owner", kind: "Initials", ...P(452, 798), w: 6, optional: "Optional — customer decides" },
  { id: "f5", page: 1, label: "Owner signature + date", who: "Owner", kind: "Signature", ...P(46, 917), w: 30 },
  { id: "f6", page: 1, label: "Second owner signature (if any)", who: "Second owner", kind: "Signature", ...P(46, 939), w: 30, optional: "Only if there is a second owner" },
  { id: "f7", page: 1, label: "Contractor signature + date", who: "Contractor", kind: "Signature", ...P(405, 939), w: 22 },
  { id: "f8", page: 3, label: "Notice of Cancellation — received (2 copies)", who: "Owner", kind: "Signature", ...P(420, 416), w: 25 },
  { id: "f9", page: 5, label: "Arbitration clause #1 — initials", who: "Owner", kind: "Initials", ...P(478, 399), w: 12, optional: "Only if they agreed to arbitration" },
  { id: "f10", page: 5, label: "Arbitration clause #2 — initials", who: "Owner", kind: "Initials", ...P(478, 808), w: 12, optional: "Only if they agreed to arbitration" },
  { id: "f11", page: 5, label: "Customer acknowledgment — sign + date", who: "Owner", kind: "Signature", ...P(345, 950), w: 25 },
  { id: "f12", page: 6, label: "Additional Description p.1 (scope)", who: "Owner", kind: "Signature", x: 55, y: 92.5, w: 35 },
  { id: "f13", page: 7, label: "Additional Description p.2 (price + payment schedule)", who: "Owner", kind: "Signature", x: 55, y: 92.5, w: 35 },
];

export const SIGN_PAGES = [
  { n: 1, title: "Home Improvement Contract — page 1", img: "/forms/form203-1.png" },
  { n: 2, title: "Terms & conditions", img: "/forms/form203-2.png" },
  { n: 3, title: "Notice of Cancellation", img: "/forms/form203-3.png" },
  { n: 4, title: "Notice of Cancellation (copy)", img: "/forms/form203-4.png" },
  { n: 5, title: "Arbitration + acknowledgment", img: "/forms/form203-5.png" },
  { n: 6, title: "Additional Description — scope of work", img: null },
  { n: 7, title: "Additional Description — price & payments", img: null },
];

export const DEMO_CHANGE_ORDER = {
  number: 1,
  contractRef: "Contract #2026-031 signed Aug 25, 2026",
  date: "Oct 10, 2026",
  customer: DEMO_ESTIMATE.customer,
  title: "Add 20 LF of wall + french drain",
  note: "As we discussed on site — while the crew is already set up, we can extend the wall 20 ft toward the side yard and add drainage behind it. Here are the details.",
  sections: [
    { title: "Wall extension — 20 LF", items: ["Excavate and pour reinforced footings for 20 additional feet", "Extend CMU wall at matching height", "Stucco finish to match the existing wall"] },
    { title: "French drain", items: ["Perforated pipe, gravel and filter fabric behind the full wall", "Tie into existing side-yard drain"] },
  ],
  exclusions: ["Irrigation changes", "Additional permit fees, if required by the City (billed at cost)"],
  base: 14800,
  schedule: [
    { name: "Upon signing this change order", pct: 0.5 },
    { name: "Upon completion of added wall", pct: 0.5 },
  ],
  daysAdded: 6,
};

/** Sample contract used for the email simulation (fictional customer). */
export const DEMO_CONTRACT = {
  customer: { name: "Daniel & Sarah Whitman", first: "Daniel", email: "whitman.sample@example.com", address: "1450 Palm Ridge Dr, San Diego, CA 92117" },
  title: "50 LF CMU garden wall — footings, plans & stucco",
  price: 35000,
  start: "Dec 1, 2026 (after permit)",
  finish: "Jan 15, 2027",
  schedule: [
    { name: "Deposit — upon signing", amount: 1000 },
    { name: "Architectural & structural plans completed", amount: 3500 },
    { name: "Plans submitted to the City of San Diego", amount: 1500 },
    { name: "Demolition, excavation & footing forms/rebar", amount: 11000 },
    { name: "Footings poured & 50 LF CMU wall built", amount: 12000 },
    { name: "Stucco finish, final inspection & clean-up", amount: 6000 },
  ],
};
