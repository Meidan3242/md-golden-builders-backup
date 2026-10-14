// Demo data for the prototype. All customers below are fictional.
// Replaced by the database once the real backend is connected.
import type {
  Activity,
  Appointment,
  ChangeOrder,
  Expense,
  FollowUp,
  Lead,
  LeadSource,
  LeadStage,
  MarketingSpend,
  MediaItem,
  PaymentMilestone,
  Project,
  Subcontractor,
  User,
} from "./types";

/** Fixed "today" so the demo always looks the same. */
export const TODAY = new Date("2026-10-10T09:00:00-07:00");

const day = 86_400_000;
/** Date `offsetDays` from today at a San Diego local time (PDT, UTC-7). */
const iso = (offsetDays: number, hour = 10, min = 0) => new Date(Date.UTC(2026, 9, 10 + offsetDays, hour + 7, min)).toISOString();

export const USERS: User[] = [
  { id: "u-owner", name: "Meidan D.", role: "admin", initials: "MD", title: "Owner" },
  { id: "u-office", name: "Laline", role: "office", initials: "LA", title: "Office Manager" },
  { id: "u-rep", name: "Demo Sales Rep", role: "sales", initials: "SR", title: "Sales Rep" },
  { id: "u-pm", name: "Demo Project Manager", role: "pm", initials: "PM", title: "Project Manager" },
];

export const SUBCONTRACTORS: Subcontractor[] = [
  { id: "s-1", name: "Carlos M.", company: "CM Concrete & Masonry", trade: "Concrete / Masonry", phone: "(619) 555-0141", licenseNo: "C-8 #998812", insuranceExpires: iso(120), w9: true, preferredMethod: "Zelle" },
  { id: "s-2", name: "Dan R.", company: "Coastline Electric", trade: "Electrical", phone: "(858) 555-0177", licenseNo: "C-10 #1012233", insuranceExpires: iso(18), w9: true, preferredMethod: "Check" },
  { id: "s-3", name: "Luis P.", company: "Pacific Plumbing Pros", trade: "Plumbing", phone: "(619) 555-0102", licenseNo: "C-36 #887120", insuranceExpires: iso(210), w9: true, preferredMethod: "Zelle" },
  { id: "s-4", name: "Mike T.", company: "Mike's Drywall", trade: "Drywall / Paint", phone: "(760) 555-0190", insuranceExpires: iso(-5), w9: false, preferredMethod: "Cash" },
  { id: "s-5", name: "Jorge A.", company: "Golden Tile Works", trade: "Tile", phone: "(619) 555-0123", licenseNo: "C-54 #1100456", insuranceExpires: iso(300), w9: true, preferredMethod: "Venmo" },
  { id: "s-6", name: "Ray K.", company: "SD Stucco & Plaster", trade: "Stucco", phone: "(858) 555-0168", licenseNo: "C-35 #964201", insuranceExpires: iso(75), w9: true, preferredMethod: "Check" },
  { id: "s-7", name: "Ana V.", company: "Vista Cabinets", trade: "Cabinets", phone: "(619) 555-0155", licenseNo: "C-6 #1033781", insuranceExpires: iso(160), w9: true, preferredMethod: "ACH" },
];

// ---------------------------------------------------------------- Leads

const first = ["Olivia", "Noah", "Emma", "Liam", "Sophia", "Mason", "Ava", "Ethan", "Mia", "Lucas", "Isabella", "Logan", "Harper", "Jacob", "Amelia", "Daniel", "Evelyn", "Henry", "Abigail", "Owen", "Ella", "Wyatt", "Grace", "Caleb", "Chloe", "Ryan", "Nora", "Aaron", "Lily", "Isaac", "Zoe", "Nathan"];
const last = ["Carter", "Bennett", "Hayes", "Morales", "Brooks", "Reed", "Patel", "Kim", "Nguyen", "Foster", "Rivera", "Coleman", "Price", "Sanders", "Ward", "Ortiz", "Hughes", "Myers", "Long", "Ross", "Powell", "Jenkins", "Perry", "Russell", "Griffin", "Diaz", "Hayes", "Wood", "Barnes", "Fisher", "Henderson", "Simmons"];
const cities = ["San Diego", "La Jolla", "Chula Vista", "Escondido", "Carlsbad", "El Cajon", "Oceanside", "Poway", "Santee", "Encinitas", "National City", "La Mesa"];
const streets = ["Neptune Pl", "Garnet Ave", "Mission Blvd", "Balboa Ave", "Clairemont Dr", "Genesee Ave", "Rosecrans St", "University Ave", "El Camino Real", "Via de la Valle", "Palm Ave", "Grand Ave"];
const services: [string, number][] = [
  ["Kitchen Remodel", 68000],
  ["Bathroom Remodel", 32000],
  ["ADU Construction", 240000],
  ["Room Addition", 145000],
  ["Full Home Remodel", 310000],
  ["Retaining Wall", 52000],
  ["Flooring Installation", 14000],
  ["Garage Conversion", 98000],
  ["Interior Paint", 9000],
  ["Patio / Deck", 26000],
];
const sources: LeadSource[] = ["Google", "Yelp", "Thumbtack", "Google", "Yelp", "Thumbtack", "Instagram", "Referral", "Google", "Thumbtack", "Yelp", "Facebook"];
const stagePlan: LeadStage[] = [
  "New", "New", "New", "New",
  "Trying to Reach", "Trying to Reach", "Trying to Reach",
  "Appointment Set", "Appointment Set", "Appointment Set", "Appointment Set",
  "Need to Send Estimate", "Need to Send Estimate", "Need to Send Estimate",
  "Estimate Sent", "Estimate Sent", "Estimate Sent", "Estimate Sent", "Estimate Sent", "Talking", "Talking",
  "Second Meeting", "Second Meeting",
  "Won", "Won", "Won", "Won", "Won",
  "Paused", "No Response", "Not a Fit", "Lost",
];
const lostReasons = ["Price too high", "Went with another contractor", "Project cancelled", "No response after 5 follow-ups"];

function phone(i: number) {
  const area = ["619", "858", "760"][i % 3];
  return `(${area}) 555-${String(1000 + i * 37).slice(-4)}`;
}

// days since the estimate went out, for leads in "Estimate Sent" (so follow-ups land on today)
const estimateAge = [1, 3, 2, 7, 14, 9, 30];
let estimateIdx = 0;

export const CITY_COORDS: Record<string, [number, number]> = {
  "San Diego": [32.7157, -117.1611], "La Jolla": [32.8328, -117.2713], "Chula Vista": [32.6401, -117.0842],
  Escondido: [33.1192, -117.0864], Carlsbad: [33.1581, -117.3506], "El Cajon": [32.7948, -116.9625],
  Oceanside: [33.1959, -117.3795], Poway: [32.9628, -117.0359], Santee: [32.8384, -116.9739],
  Encinitas: [33.037, -117.292], "National City": [32.6781, -117.0992], "La Mesa": [32.7678, -117.0231],
  Fallbrook: [33.3764, -117.2511], Ramona: [33.0417, -116.8681], Julian: [33.0787, -116.602], "Spring Valley": [32.7448, -116.9989],
};
export const jitter = (i: number, scale = 0.02) => [((i * 37) % 11 - 5) * scale / 5, ((i * 53) % 13 - 6) * scale / 6] as const;

function demoThread(i: number, name: string, source: LeadSource, stage: LeadStage, created: number, service: string) {
  const ch = source === "Thumbtack" ? "Thumbtack" : source === "Yelp" ? "Yelp" : "Text";
  const first = name.split(" ")[0];
  const t: { at: string; from: "customer" | "us" | "robot"; channel: "Text" | "Thumbtack" | "Yelp" | "Email" | "Call"; text: string }[] = [
    { at: iso(created, 9, 10), from: "customer", channel: ch, text: `Hi, I'm looking for a quote for ${service.toLowerCase()}. When can someone come take a look?` },
    { at: iso(created, 9, 11), from: "robot", channel: ch, text: `Hi ${first}! Thanks for reaching out to MD Golden Builders. What's the best number to reach you, and what days work for a free on-site estimate?` },
  ];
  if (stage === "New") return t;
  t.push({ at: iso(created, 11, 30), from: "us", channel: "Text", text: `Hi ${first}, this is Laline with MD Golden Builders 🙂 Meidan can stop by Tue or Wed afternoon — what works for you?` });
  if (stage === "Talking") {
    t.push({ at: iso(created, 13, 2), from: "customer", channel: ch, text: "Thanks! Can you give me a rough price range before someone comes out?" });
    t.push({ at: iso(created, 13, 20), from: "us", channel: "Text", text: `Of course ${first} — most projects like yours land between $25k and $45k depending on finishes. Meidan can confirm on site, free. Would Thursday work?` });
    return t;
  }
  if (stage === "Trying to Reach" || stage === "No Response") {
    t.push({ at: iso(created + 2, 10), from: "us", channel: "Text", text: `Hi ${first}, just following up — would you still like a free estimate this week?` });
    return t;
  }
  t.push({ at: iso(created, 12, 5), from: "customer", channel: "Text", text: "Wednesday after 3 works great." });
  t.push({ at: iso(created, 12, 7), from: "us", channel: "Text", text: "Perfect — Wednesday 3:30 PM. You'll get a reminder the day before. Thank you!" });
  return t;
}

export const LEADS: Lead[] = stagePlan.map((stage, i) => {
  const [service, base] = services[i % services.length];
  // This week's leads (new, no answer, talking, just booked) are recent; the rest are older history.
  const created =
    stage === "Trying to Reach" || stage === "Talking" ? -((i % 3) + 1) * 2 + 1
    : stage === "Appointment Set" ? -(i % 5) - 1
    : stage === "No Response" ? -8
    : -Math.floor(i * 1.6) - (stage === "New" ? 0 : 3);
  const name = `${first[i]} ${last[i]}`;
  const assignedTo = i % 5 === 3 ? "u-rep" : "u-owner";
  const hasEstimate = ["Estimate Sent", "Second Meeting", "Won", "Paused", "Lost"].includes(stage);
  const sentOffset = stage === "Estimate Sent" ? -estimateAge[estimateIdx++ % estimateAge.length] : created + 4;
  const amount = Math.round((base * (0.8 + ((i * 7) % 9) / 10)) / 100) * 100;
  const activity: Activity[] = [
    { id: `a-${i}-1`, at: iso(created, 9, 12), by: "u-office", kind: "call", text: `Inbound call from ${sources[i % sources.length]} — lead created by Laline` },
  ];
  if (stage !== "New") activity.push({ id: `a-${i}-2`, at: iso(created + 1, 11), by: "u-office", kind: "sms", text: "Texted customer to schedule a site visit" });
  if (hasEstimate) activity.push({ id: `a-${i}-3`, at: iso(sentOffset, 16), by: "u-owner", kind: "estimate", text: `Joist estimate sent — $${amount.toLocaleString()}` });
  if (hasEstimate && i % 2 === 0) activity.push({ id: `a-${i}-4`, at: iso(sentOffset + 1, 8, 41), by: "u-owner", kind: "estimate", text: "Customer opened the estimate in Joist" });
  return {
    id: `L-${1040 + i}`,
    name,
    phone: phone(i),
    email: `${first[i].toLowerCase()}.${last[i].toLowerCase()}@example.com`,
    address: `${1200 + i * 47} ${streets[i % streets.length]}`,
    city: cities[i % cities.length],
    service,
    source: sources[i % sources.length],
    stage,
    createdAt: iso(created, 9, 12),
    assignedTo,
    estimateAmount: hasEstimate || stage === "Need to Send Estimate" ? amount : undefined,
    estimateSentAt: hasEstimate ? iso(sentOffset, 16) : undefined,
    estimateViewedAt: hasEstimate && i % 2 === 0 ? iso(Math.min(sentOffset + 1, 0), 8, 41) : undefined,
    lostReason: stage === "Lost" ? lostReasons[i % lostReasons.length] : undefined,
    notes: i % 3 === 0 ? "Customer prefers text messages. Gate code at the side door." : undefined,
    calls: [
      { id: `c-${i}-1`, at: iso(created, 9, 12), direction: "Inbound", durationSec: 180 + ((i * 53) % 420), by: "u-office", summary: `Wants a quote for ${service.toLowerCase()}. Budget flexible, hoping to start within 1–2 months.` },
      ...(stage !== "New" ? [{ id: `c-${i}-2`, at: iso(created + 1, 11), direction: "Outbound" as const, durationSec: 95 + ((i * 31) % 200), by: "u-office" }] : []),
    ],
    activity: activity.reverse(),
    attempts: stage === "New" ? 0 : stage === "Trying to Reach" ? 1 + (i % 4) : stage === "No Response" ? 5 : undefined,
    thread: demoThread(i, name, sources[i % sources.length], stage, created, service),
    lat: (CITY_COORDS[cities[i % cities.length]] ?? CITY_COORDS["San Diego"])[0] + jitter(i)[0],
    lng: (CITY_COORDS[cities[i % cities.length]] ?? CITY_COORDS["San Diego"])[1] + jitter(i)[1],
  };
});

// ---------------------------------------------------------------- Projects

function schedule(total: number, names: string[], split: number[], paidCount: number, firstDue: number): PaymentMilestone[] {
  const deposit = Math.min(1000, Math.round(total * 0.1));
  const rest = total - deposit;
  const ms: PaymentMilestone[] = [{ id: "m0", name: "Deposit", amount: deposit, status: "Paid", paidAt: iso(firstDue - 20), method: "Square (card)" }];
  split.forEach((pct, i) => {
    const paid = i + 1 < paidCount;
    const current = i + 1 === paidCount;
    ms.push({
      id: `m${i + 1}`,
      name: names[i],
      amount: Math.round(rest * pct),
      status: paid ? "Paid" : current ? "Invoiced" : "Upcoming",
      paidAt: paid ? iso(firstDue + i * 12) : undefined,
      dueDate: current ? iso(firstDue + i * 12) : undefined,
      method: paid ? (["Zelle", "Check", "ACH", "Square (card)"] as const)[i % 4] : undefined,
    });
  });
  return ms;
}

const media = (n: number, phases: MediaItem["phase"][]): MediaItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `md-${i}`,
    phase: phases[i % phases.length],
    kind: i % 4 === 3 ? "video" : "photo",
    caption: ["Front elevation", "Demo day", "Footings poured", "Framing walk-through", "Rough plumbing", "Drywall up", "Tile layout", "Final walk-through"][i % 8],
    at: iso(-40 + i * 4),
    hue: (i * 47) % 360,
  }));

const exp = (items: [string, Expense["category"], number, number][]): Expense[] =>
  items.map(([vendor, category, amount, d], i) => ({ id: `e-${i}`, date: iso(d), vendor, category, amount, receipt: i % 4 !== 2, by: "u-owner" }));

const retainingCO: ChangeOrder = {
  id: "co-1",
  number: 1,
  title: "Add 20 LF of wall + drainage",
  amount: 14800,
  status: "Signed",
  signedAt: iso(-12),
  milestones: [
    { id: "com1", name: "Upon signing", amount: 7400, status: "Paid", paidAt: iso(-11), method: "Zelle" },
    { id: "com2", name: "Upon completion of added wall", amount: 7400, status: "Upcoming" },
  ],
  subs: [
    {
      id: "cosa-1",
      subId: "s-1",
      scope: "Extra 20 LF CMU wall + french drain",
      amount: 6200,
      agreement: "Signed",
      payments: [
        { id: "cosp1", name: "50% start", amount: 3100, status: "Paid", paidAt: iso(-9), method: "Zelle", reference: "ZL-88211", proof: true, lienWaiver: "Unconditional received" },
        { id: "cosp2", name: "50% complete", amount: 3100, status: "Upcoming", proof: false, lienWaiver: "N/A" },
      ],
    },
  ],
  expenses: exp([["Home Depot", "Materials", 1180, -10]]),
};

const retainingCO2: ChangeOrder = {
  id: "co-1b",
  number: 2,
  title: "Stucco finish on new section + cap",
  amount: 4600,
  status: "Sent",
  milestones: [{ id: "com3", name: "Upon signing", amount: 2300, status: "Upcoming" }, { id: "com4", name: "Upon completion", amount: 2300, status: "Upcoming" }],
  subs: [
    {
      id: "cosa-2",
      subId: "s-6",
      scope: "Stucco + cap on added 20 LF",
      amount: 1900,
      agreement: "Sent",
      payments: [{ id: "cosp3", name: "On completion", amount: 1900, status: "Upcoming", proof: false, lienWaiver: "N/A" }],
    },
  ],
  expenses: [],
};

export const PROJECTS: Project[] = [
  {
    id: "P-2026-031",
    leadId: "L-1063",
    number: "2026-031",
    customer: "Rachel Donovan",
    phone: "(858) 555-1851",
    email: "rachel.donovan@example.com",
    address: "7025 Neptune Pl",
    city: "La Jolla",
    type: "Retaining Wall",
    stage: "In Progress",
    assignedTo: "u-owner",
    contractValue: 85760,
    signedAt: iso(-46),
    startDate: iso(-30),
    targetCompletion: iso(25),
    warrantyYears: 5,
    milestones: schedule(85760, ["Upon start of demo", "Upon installation of footings", "Upon stucco installation", "Project completion"], [0.4, 0.4, 0.1, 0.1], 3, -28),
    changeOrders: [retainingCO, retainingCO2],
    subs: [
      {
        id: "sa-1",
        subId: "s-1",
        scope: "Footings + 95 LF CMU retaining wall",
        amount: 31500,
        agreement: "Signed",
        payments: [
          { id: "sp1", name: "Start / demo", amount: 9450, status: "Paid", paidAt: iso(-27), method: "Zelle", reference: "ZL-77410", proof: true, lienWaiver: "Unconditional received" },
          { id: "sp2", name: "Footings complete", amount: 9450, status: "Paid", paidAt: iso(-14), method: "Check", reference: "Check #1187", proof: true, lienWaiver: "Conditional received" },
          { id: "sp3", name: "Wall complete", amount: 9450, status: "Requested", proof: false, lienWaiver: "Missing" },
          { id: "sp4", name: "Final", amount: 3150, status: "Upcoming", proof: false, lienWaiver: "N/A" },
        ],
      },
      {
        id: "sa-2",
        subId: "s-6",
        scope: "Stucco finish on new wall",
        amount: 7800,
        agreement: "Sent",
        payments: [
          { id: "sp5", name: "Scratch + brown coat", amount: 3900, status: "Upcoming", proof: false, lienWaiver: "N/A" },
          { id: "sp6", name: "Color coat", amount: 3900, status: "Upcoming", proof: false, lienWaiver: "N/A" },
        ],
      },
    ],
    expenses: exp([
      ["Home Depot", "Materials", 4280, -29],
      ["Sunbelt Rentals", "Equipment rental", 1650, -28],
      ["Miramar Landfill", "Dump / haul", 920, -26],
      ["City of San Diego", "Permit fees", 2340, -60],
      ["Structural engineer", "Design / engineering", 3200, -70],
      ["Hanson Aggregates", "Materials", 6100, -16],
    ]),
    permits: [
      {
        id: "pm-1",
        jurisdiction: "City of San Diego",
        number: "PRJ-1123456",
        type: "Retaining wall (combination permit)",
        status: "Approved",
        submittedAt: iso(-75),
        approvedAt: iso(-35),
        fee: 2340,
        inspections: [
          { name: "Footing / foundation", date: iso(-15), result: "Passed" },
          { name: "Grout / reinforcement", date: iso(3), result: "Scheduled" },
          { name: "Final", date: undefined },
        ],
      },
    ],
    media: media(14, ["Before", "Before", "During", "During", "During"]),
    documents: [
      { id: "d1", name: "Home Improvement Contract (Form 203).pdf", kind: "Contract", at: iso(-46), signed: true },
      { id: "d2", name: "Additional Description — Scope & Payment.pdf", kind: "Additional Description", at: iso(-46), signed: true },
      { id: "d3", name: "Joist Estimate #4471.pdf", kind: "Estimate", at: iso(-52) },
      { id: "d4", name: "Approved structural plans.pdf", kind: "Plans", at: iso(-35) },
      { id: "d5", name: "Change Order #1.pdf", kind: "Change Order", at: iso(-12), signed: true },
      { id: "d6", name: "Conditional waiver — CM Concrete — progress 2.pdf", kind: "Lien Waiver", at: iso(-14) },
    ],
    chat: [
      { id: "ch1", at: iso(-2, 8, 12), by: "u-office", text: "@MD did the customer pay for the extra 20 ft already?" },
      { id: "ch2", at: iso(-2, 8, 30), by: "u-owner", text: "Yes, paid the change order yesterday", attachment: { name: "zelle-screenshot.jpg", kind: "image" },
        capture: { kind: "Customer payment", fields: [["Amount", "$7,400"], ["Method", "Zelle"], ["For", "Change Order #1 — Upon signing"], ["Date", "Oct 1"]], destination: "Payments › Change Order #1 · screenshot saved to Documents › Receipts", status: "Saved" } },
      { id: "ch3", at: iso(-1, 15, 2), by: "u-owner", text: "", attachment: { name: "6 photos", kind: "image" },
        capture: { kind: "Photos", fields: [["Photos", "6"], ["Phase", "During"]], destination: "Photos & videos › During", status: "Saved" } },
      { id: "ch4", at: iso(-1, 16, 40), by: "u-owner", text: "/paid carlos 9450 check 1192 wall complete", attachment: { name: "check-1192.jpg", kind: "image" },
        capture: { kind: "Sub payment", fields: [["Sub", "CM Concrete & Masonry (Carlos)"], ["Amount", "$9,450"], ["Method", "Check #1192"], ["Milestone", "Wall complete"]], destination: "Subcontractors › CM Concrete · proof attached · lien waiver requested by text", status: "Needs confirmation" } },
      { id: "ch5", at: iso(0, 7, 55), by: "u-owner", text: "home depot 312.40 rebar + grout", attachment: { name: "receipt.jpg", kind: "image" },
        capture: { kind: "Expense", fields: [["Vendor", "Home Depot"], ["Amount", "$312.40"], ["Category", "Materials"]], destination: "Expenses · receipt attached", status: "Saved" } },
      { id: "ch6", at: iso(0, 8, 20), by: "u-owner", text: "wall is up, stucco crew monday", attachment: { name: "wall-walkthrough.mov · 0:42", kind: "video" },
        capture: { kind: "Photos", fields: [["Video", "0:42"], ["Phase", "During"]], destination: "Photos & videos › During · also added to Friday's customer update", status: "Saved" } },
      { id: "ch7", at: iso(0, 8, 24), by: "u-owner", text: "send rachel a summary of what she paid so far" },
      { id: "ch8", at: iso(0, 8, 24), by: "assistant", text: "",
        reply: { title: "Draft — payment summary to Rachel", channel: "Text + email · from the business line",
          body: ["Hi Rachel, here's a quick summary of your project payments 🙂", "Contract $85,760 + Change Order #1 $14,800 = $100,560", "Paid so far: $76,208 (deposit, demo, footings, CO #1 signing)", "Next: $8,476 upon stucco installation (starting Monday)", "Balance after that: $15,876. Thank you! — Meidan, MD Golden Builders"],
          actions: ["Send", "Edit", "Email only"] } },
      { id: "ch9", at: iso(0, 8, 31), by: "u-owner", text: "how much do we still owe the subs on this job?" },
      { id: "ch10", at: iso(0, 8, 31), by: "assistant", text: "",
        reply: { title: "Subs — open balance on this project", body: ["CM Concrete (Carlos): $12,600 left — $9,450 requested for “Wall complete” (check #1192 waiting for your OK), $3,150 final", "CM Concrete — Change Order #1: $3,100 left (50% on completion)", "SD Stucco: $7,800 — agreement still not signed ⚠️", "Total still to pay: $23,500"],
          actions: ["Add to Friday pay run", "Text SD Stucco the agreement"] } },
      { id: "ch11", at: iso(0, 8, 35), by: "u-office", text: "@assistant remind Meidan tomorrow 7am to order the wall cap" },
      { id: "ch12", at: iso(0, 8, 35), by: "assistant", text: "", reply: { title: "Reminder set", body: ["Tomorrow 7:00 AM → Meidan: order precast wall cap (Rachel Donovan · 7025 Neptune Pl)"], done: "✓ Added to Meidan's tasks" } },
      { id: "ch13", at: iso(0, 9, 2), by: "u-owner", text: "customer wants 2 more outlets in the garage, 450. show me before you send" },
      { id: "ch14", at: iso(0, 9, 2), by: "assistant", text: "",
        reply: { title: "Draft — Change Order #2 (not sent)", channel: "Preview only",
          body: ["Add 2 GFCI outlets in garage, incl. wiring from existing circuit and City inspection", "Price: $450 · paid on completion of the outlets", "New contract total: $101,010", "Electrician: Coastline Electric (Dan) — I'll ask him for his price after you approve"],
          actions: ["Send to Rachel for signature", "Edit", "Not now"] } },
      { id: "ch15", at: iso(0, 9, 4), by: "u-owner", text: "make it 475 and say it's 1 outlet + 1 light switch" },
      { id: "ch16", at: iso(0, 9, 4), by: "assistant", text: "",
        reply: { title: "Updated draft — Change Order #2", channel: "Preview only",
          body: ["Add 1 GFCI outlet + 1 light switch in garage, incl. wiring and City inspection", "Price: $475 · paid on completion", "New contract total: $101,035"],
          actions: ["Send to Rachel for signature", "Edit", "Not now"] } },
      { id: "ch17", at: iso(0, 9, 5), by: "u-owner", text: "send" },
      { id: "ch18", at: iso(0, 9, 5), by: "assistant", text: "",
        reply: { title: "Change Order #2 sent to Rachel", body: ["By text and email · I'll tell you when she opens and signs it.", "Also texted Dan (in Spanish): “¿Puedes pasar el lunes a ver 1 contacto + 1 apagador en el garaje? Mándame tu precio.”"], done: "✓ Sent · waiting for signature" } },
    ],
    activity: [
      { id: "pa1", at: iso(-1, 15), by: "u-owner", kind: "file", text: "Uploaded 6 photos — wall at 4 ft" },
      { id: "pa2", at: iso(-3, 10), by: "u-office", kind: "payment", text: "Invoice sent: Upon installation of footings — $33,904" },
      { id: "pa3", at: iso(-12, 17), by: "u-owner", kind: "note", text: "Change Order #1 signed by customer" },
      { id: "pa4", at: iso(-15, 13), by: "u-owner", kind: "note", text: "Footing inspection passed" },
    ],
  },
  {
    id: "P-2026-034",
    leadId: "L-1064",
    number: "2026-034",
    customer: "Marcus Bell",
    phone: "(619) 555-1888",
    address: "1858 Mission Blvd",
    city: "San Diego",
    type: "Kitchen Remodel",
    stage: "In Progress",
    assignedTo: "u-owner",
    contractValue: 72400,
    signedAt: iso(-33),
    startDate: iso(-20),
    targetCompletion: iso(30),
    warrantyYears: 1,
    milestones: schedule(72400, ["Upon demo", "Upon rough plumbing & electrical", "Upon cabinets install", "Project completion"], [0.35, 0.35, 0.2, 0.1], 2, -18),
    changeOrders: [],
    subs: [
      { id: "sa-3", subId: "s-3", scope: "Rough + finish plumbing", amount: 6800, agreement: "Signed", payments: [
        { id: "sp7", name: "Rough", amount: 3400, status: "Paid", paidAt: iso(-8), method: "Zelle", reference: "ZL-90122", proof: true, lienWaiver: "Conditional received" },
        { id: "sp8", name: "Finish", amount: 3400, status: "Upcoming", proof: false, lienWaiver: "N/A" },
      ] },
      { id: "sa-4", subId: "s-2", scope: "Rough + finish electrical, recessed lights", amount: 7400, agreement: "Signed", payments: [
        { id: "sp9", name: "Rough", amount: 3700, status: "Requested", proof: false, lienWaiver: "Missing" },
        { id: "sp10", name: "Finish", amount: 3700, status: "Upcoming", proof: false, lienWaiver: "N/A" },
      ] },
      { id: "sa-5", subId: "s-7", scope: "Supply + install shaker cabinets", amount: 18900, agreement: "Not sent", payments: [
        { id: "sp11", name: "Order deposit", amount: 9450, status: "Upcoming", proof: false, lienWaiver: "N/A" },
      ] },
    ],
    expenses: exp([["Home Depot", "Materials", 2140, -19], ["Ferguson", "Materials", 3890, -9], ["Miramar Landfill", "Dump / haul", 480, -18]]),
    permits: [{ id: "pm-2", jurisdiction: "City of San Diego", number: "PRJ-1129870", type: "Kitchen remodel — electrical/plumbing", status: "Approved", submittedAt: iso(-30), approvedAt: iso(-22), fee: 860, inspections: [{ name: "Rough electrical/plumbing", date: iso(2), result: "Scheduled" }, { name: "Final" }] }],
    media: media(9, ["Before", "Before", "During"]),
    documents: [
      { id: "d1", name: "Home Improvement Contract (Form 203).pdf", kind: "Contract", at: iso(-33), signed: true },
      { id: "d2", name: "Additional Description — Scope & Payment.pdf", kind: "Additional Description", at: iso(-33), signed: true },
    ],
    activity: [{ id: "pa1", at: iso(-2, 9), by: "u-office", kind: "note", text: "Cabinet delivery confirmed for 10/17" }],
  },
  {
    id: "P-2026-036",
    leadId: "L-1065",
    number: "2026-036",
    customer: "Priya Shah",
    phone: "(760) 555-1925",
    address: "2045 Palm Ave",
    city: "Chula Vista",
    type: "ADU Construction",
    stage: "Waiting on Permit",
    assignedTo: "u-owner",
    contractValue: 238000,
    signedAt: iso(-21),
    targetCompletion: iso(200),
    warrantyYears: 5,
    milestones: schedule(238000, ["Upon permit issuance & mobilization", "Upon foundation", "Upon framing", "Upon drywall", "Upon finishes", "Project completion"], [0.15, 0.2, 0.2, 0.15, 0.2, 0.1], 1, 25),
    changeOrders: [],
    subs: [
      { id: "sa-7", subId: "s-1", scope: "Foundation + slab", amount: 28500, agreement: "Not sent", payments: [{ id: "sp14", name: "Foundation", amount: 28500, status: "Upcoming", proof: false, lienWaiver: "N/A" }] },
      { id: "sa-8", subId: "s-2", scope: "Electrical — new 200A sub-panel, rough + finish", amount: 21000, agreement: "Not sent", payments: [{ id: "sp15", name: "Rough", amount: 10500, status: "Upcoming", proof: false, lienWaiver: "N/A" }, { id: "sp16", name: "Finish", amount: 10500, status: "Upcoming", proof: false, lienWaiver: "N/A" }] },
      { id: "sa-9", subId: "s-3", scope: "Plumbing — sewer tie-in, rough + finish", amount: 24000, agreement: "Not sent", payments: [{ id: "sp17", name: "Rough", amount: 12000, status: "Upcoming", proof: false, lienWaiver: "N/A" }, { id: "sp18", name: "Finish", amount: 12000, status: "Upcoming", proof: false, lienWaiver: "N/A" }] },
      { id: "sa-10", subId: "s-6", scope: "Exterior stucco", amount: 16500, agreement: "Not sent", payments: [{ id: "sp19", name: "Complete", amount: 16500, status: "Upcoming", proof: false, lienWaiver: "N/A" }] },
    ],
    expenses: exp([["Architect — plans", "Design / engineering", 6500, -18], ["Chula Vista permit center", "Permit fees", 4120, -6]]),
    permits: [{ id: "pm-3", jurisdiction: "Chula Vista", type: "Detached ADU — new construction", status: "Corrections", submittedAt: iso(-10), fee: 4120, inspections: [] }],
    media: media(4, ["Before"]),
    documents: [
      { id: "d1", name: "Home Improvement Contract (Form 203).pdf", kind: "Contract", at: iso(-21), signed: true },
      { id: "d2", name: "ADU plan set rev B.pdf", kind: "Plans", at: iso(-12) },
    ],
    activity: [{ id: "pa1", at: iso(-1, 14), by: "u-owner", kind: "note", text: "City returned plan check corrections — architect to resubmit by 10/15" }],
  },
  {
    id: "P-2026-029",
    leadId: "L-1066",
    number: "2026-029",
    customer: "Tom Gallagher",
    phone: "(619) 555-1962",
    address: "2152 Grand Ave",
    city: "San Diego",
    type: "Bathroom Remodel",
    stage: "Punch List",
    assignedTo: "u-rep",
    contractValue: 34600,
    signedAt: iso(-70),
    startDate: iso(-50),
    targetCompletion: iso(-2),
    warrantyYears: 1,
    milestones: schedule(34600, ["Upon demo", "Upon tile install", "Project completion"], [0.45, 0.45, 0.1], 3, -48),
    changeOrders: [{ id: "co-2", number: 1, title: "Upgrade to curbless shower + niche", amount: 3900, status: "Sent", milestones: [{ id: "c2m1", name: "Upon signing", amount: 3900, status: "Upcoming" }], subs: [], expenses: [] }],
    subs: [{ id: "sa-6", subId: "s-5", scope: "Shower + floor tile", amount: 6400, agreement: "Signed", payments: [
      { id: "sp12", name: "Start", amount: 3200, status: "Paid", paidAt: iso(-30), method: "Venmo", reference: "@goldentile", proof: true, lienWaiver: "Unconditional received" },
      { id: "sp13", name: "Complete", amount: 3200, status: "Paid", paidAt: iso(-9), method: "Venmo", proof: false, lienWaiver: "Missing" },
    ] }],
    expenses: exp([["Floor & Decor", "Materials", 3120, -40], ["Home Depot", "Materials", 940, -35]]),
    permits: [{ id: "pm-4", jurisdiction: "City of San Diego", number: "PRJ-1117741", type: "Bathroom remodel", status: "Finaled", submittedAt: iso(-66), approvedAt: iso(-58), fee: 610, inspections: [{ name: "Rough", date: iso(-35), result: "Passed" }, { name: "Final", date: iso(-4), result: "Passed" }] }],
    media: media(12, ["Before", "During", "After"]),
    documents: [{ id: "d1", name: "Home Improvement Contract (Form 203).pdf", kind: "Contract", at: iso(-70), signed: true }],
    activity: [{ id: "pa1", at: iso(-1, 12), by: "u-rep", kind: "note", text: "Punch list: caulk vanity, replace one cracked outlet cover" }],
  },
  {
    id: "P-2026-022",
    leadId: "L-1067",
    number: "2026-022",
    customer: "Linda Moreno",
    phone: "(858) 555-1999",
    address: "1999 Via de la Valle",
    city: "Encinitas",
    type: "Flooring Installation",
    stage: "Completed",
    assignedTo: "u-owner",
    contractValue: 16800,
    signedAt: iso(-95),
    startDate: iso(-80),
    targetCompletion: iso(-70),
    warrantyYears: 1,
    milestones: schedule(16800, ["Upon material delivery", "Project completion"], [0.6, 0.4], 3, -80),
    changeOrders: [],
    subs: [{ id: "sa-11", subId: "s-5", scope: "Install LVP flooring, 1,100 sq ft", amount: 4400, agreement: "Signed", payments: [{ id: "sp20", name: "Complete", amount: 4400, status: "Paid", paidAt: iso(-70), method: "Venmo", reference: "@goldentile", proof: true, lienWaiver: "Unconditional received" }] }],
    expenses: exp([["Floor & Decor", "Materials", 6200, -82]]),
    permits: [],
    media: media(8, ["Before", "After"]),
    documents: [
      { id: "d1", name: "Home Improvement Contract (Form 203).pdf", kind: "Contract", at: iso(-95), signed: true },
      { id: "d2", name: "Completion Form — signed.pdf", kind: "Completion Form", at: iso(-69), signed: true },
    ],
    activity: [{ id: "pa1", at: iso(-69), by: "u-office", kind: "email", text: "Completion form + 1-year warranty + review links sent" }],
  },
];

// link won leads to projects
for (const p of PROJECTS) {
  const lead = LEADS.find((l) => l.id === p.leadId);
  if (lead) {
    lead.stage = "Won";
    lead.projectId = p.id;
    lead.name = p.customer;
    lead.service = p.type;
    lead.assignedTo = p.assignedTo;
    lead.estimateAmount = p.contractValue;
  }
}

// ---------------------------------------------------------------- Calendar & follow-ups

const leadBy = (stage: LeadStage, n: number) => LEADS.filter((l) => l.stage === stage)[n];

export const APPOINTMENTS: Appointment[] = [
  { id: "ap1", leadId: leadBy("Appointment Set", 0).id, title: `Site visit — ${leadBy("Appointment Set", 0).name}`, type: "Site Visit", start: iso(0, 11), durationMin: 60, assignedTo: "u-owner", confirmation: "Confirmed" },
  { id: "ap2", leadId: leadBy("Second Meeting", 0).id, title: `Second meeting — ${leadBy("Second Meeting", 0).name}`, type: "Second Meeting", start: iso(0, 14, 30), durationMin: 45, assignedTo: "u-owner", confirmation: "Confirmed" },
  { id: "ap3", leadId: leadBy("Appointment Set", 1).id, title: `Site visit — ${leadBy("Appointment Set", 1).name}`, type: "Site Visit", start: iso(1, 10), durationMin: 60, assignedTo: "u-owner", confirmation: "Awaiting reply" },
  { id: "ap4", leadId: leadBy("Appointment Set", 2).id, title: `Site visit — ${leadBy("Appointment Set", 2).name}`, type: "Site Visit", start: iso(1, 15), durationMin: 60, assignedTo: "u-rep", confirmation: "No response" },
  { id: "ap5", projectId: "P-2026-031", title: "City inspection — grout/reinforcement (Donovan)", type: "Inspection", start: iso(3, 9), durationMin: 60, assignedTo: "u-owner", confirmation: "Confirmed" },
  { id: "ap6", leadId: leadBy("Second Meeting", 1).id, title: `Second meeting — ${leadBy("Second Meeting", 1).name}`, type: "Second Meeting", start: iso(2, 17), durationMin: 45, assignedTo: "u-owner", confirmation: "Reminder scheduled" },
  { id: "ap7", projectId: "P-2026-034", title: "Rough inspection — kitchen (Bell)", type: "Inspection", start: iso(2, 8), durationMin: 60, assignedTo: "u-owner", confirmation: "Confirmed" },
  { id: "ap9", leadId: leadBy("Estimate Sent", 4).id, title: `Site visit — ${leadBy("Estimate Sent", 4).name}`, type: "Site Visit", start: iso(-8, 10), durationMin: 60, assignedTo: "u-owner", confirmation: "Confirmed" },
  { id: "ap10", projectId: "P-2026-036", title: "Permit check-in — Shah", type: "Project Meeting", start: iso(-5, 13), durationMin: 30, assignedTo: "u-owner", confirmation: "Confirmed" },
  { id: "ap11", leadId: leadBy("Estimate Sent", 1).id, title: `Site visit — ${leadBy("Estimate Sent", 1).name}`, type: "Site Visit", start: iso(-2, 16), durationMin: 60, assignedTo: "u-rep", confirmation: "Confirmed" },
  { id: "ap12", projectId: "P-2026-029", title: "Final walk-through — Gallagher", type: "Project Meeting", start: iso(6, 10), durationMin: 45, assignedTo: "u-owner", confirmation: "Reminder scheduled" },
  { id: "ap13", projectId: "P-2026-034", title: "Cabinet delivery — Bell", type: "Project Meeting", start: iso(9, 8), durationMin: 30, assignedTo: "u-owner", confirmation: "Reminder scheduled" },
  { id: "ap14", projectId: "P-2026-031", title: "Final inspection — Donovan", type: "Inspection", start: iso(17, 9), durationMin: 60, assignedTo: "u-owner", confirmation: "Reminder scheduled" },
  { id: "ap8", leadId: leadBy("Appointment Set", 3).id, title: `Site visit — ${leadBy("Appointment Set", 3).name}`, type: "Site Visit", start: iso(4, 12), durationMin: 60, assignedTo: "u-owner", confirmation: "Reminder scheduled" },
];

const FOLLOW_UP_STEPS = [
  { step: "Day 1", offset: 1, action: "Call + text: did you get the estimate? Offer a second meeting" },
  { step: "Day 3", offset: 3, action: "Call + text: answer questions, book second meeting" },
  { step: "Day 7", offset: 7, action: "Text check-in" },
  { step: "Day 14", offset: 14, action: "Call: any updates on timing?" },
  { step: "Day 30", offset: 30, action: "Final check-in, then move to Nurture" },
];

const endOfToday = new Date(iso(0, 23, 59)).getTime();

export const FOLLOW_UPS: FollowUp[] = LEADS.filter((l) => l.stage === "Estimate Sent").flatMap((l, i) => {
  const sent = new Date(l.estimateSentAt!).getTime();
  const dues = FOLLOW_UP_STEPS.map((s) => sent + s.offset * day);
  const lastDue = dues.filter((d) => d <= endOfToday).length - 1;
  return FOLLOW_UP_STEPS.map((s, j) => {
    const due = new Date(dues[j]);
    // everything before the latest step is done; the latest one is still open (one lead slipped behind)
    const done = j < lastDue - (i === 3 ? 1 : 0);
    return {
      id: `f-${l.id}-${j}`,
      leadId: l.id,
      due: due.toISOString(),
      step: s.step,
      action: s.action,
      assignedTo: i % 3 === 0 ? "u-owner" : "u-office",
      done,
    };
  });
});

// ---------------------------------------------------------------- Marketing

export const MARKETING_SPEND: MarketingSpend[] = ["2026-08", "2026-09", "2026-10"].flatMap((month) => [
  { month, source: "Google" as const, amount: 6000 },
  { month, source: "Thumbtack" as const, amount: 1600 },
  { month, source: "Yelp" as const, amount: 1500 },
  { month, source: "Marketing manager" as const, amount: 1000 },
]);

// ---------------------------------------------------------------- Map: past (completed) jobs

export const PAST_JOBS = [
  { id: "J-1", customer: "Kitchen — Morales", city: "Fallbrook", type: "Kitchen Remodel", year: 2025, value: 64000 },
  { id: "J-2", customer: "ADU — Patel", city: "Escondido", type: "ADU Construction", year: 2025, value: 228000 },
  { id: "J-3", customer: "Bathroom — Kim", city: "Ramona", type: "Bathroom Remodel", year: 2026, value: 31000 },
  { id: "J-4", customer: "Deck — Rivera", city: "Julian", type: "Patio / Deck", year: 2026, value: 27000 },
  { id: "J-5", customer: "Garage conversion — Foster", city: "Chula Vista", type: "Garage Conversion", year: 2025, value: 96000 },
  { id: "J-6", customer: "Full remodel — Brooks", city: "Carlsbad", type: "Full Home Remodel", year: 2025, value: 305000 },
  { id: "J-7", customer: "Retaining wall — Ward", city: "La Mesa", type: "Retaining Wall", year: 2026, value: 48000 },
  { id: "J-8", customer: "Bathroom — Hayes", city: "Oceanside", type: "Bathroom Remodel", year: 2026, value: 29000 },
  { id: "J-9", customer: "Kitchen — Reed", city: "Poway", type: "Kitchen Remodel", year: 2026, value: 71000 },
  { id: "J-10", customer: "Room addition — Long", city: "Santee", type: "Room Addition", year: 2025, value: 138000 },
].map((j, i) => ({ ...j, lat: CITY_COORDS[j.city][0] + jitter(i + 50)[0], lng: CITY_COORDS[j.city][1] + jitter(i + 50)[1] }));

export const PROJECT_COORDS: Record<string, [number, number]> = {
  "P-2026-031": [32.8401, -117.2652], "P-2026-034": [32.7766, -117.2523], "P-2026-036": [32.6302, -117.0605],
  "P-2026-029": [32.7121, -117.1402], "P-2026-022": [33.0503, -117.2701],
};

// ---------------------------------------------------------------- history (reports + sales goal)

export const SALES_GOAL_DEFAULT = 200_000;
export const CHANNELS = ["Google", "Yelp", "Thumbtack", "Other"] as const;
export type Channel = (typeof CHANNELS)[number];
type ChannelMonth = { leads: number; estimates: number; sold: number; soldValue: number };

const AVG_JOB: Record<Channel, number> = { Google: 19_000, Yelp: 15_500, Thumbtack: 11_500, Other: 25_000 };
const BASE_LEADS: Record<Channel, number> = { Google: 27, Yelp: 26, Thumbtack: 28, Other: 9 };

/** Jan → this month. This month only counts the days so far. */
export const MONTHLY_HISTORY: { month: string; channels: Record<Channel, ChannelMonth> }[] = Array.from({ length: 10 }, (_, m) => {
  const share = m === 9 ? 10 / 31 : 1;
  const channels = Object.fromEntries(
    CHANNELS.map((c, ci) => {
      const leads = Math.round((BASE_LEADS[c] + (((m * 7 + ci * 3) % 9) - 4)) * share);
      const estimates = Math.round(leads * (0.32 + ((m + ci) % 4) * 0.03));
      const sold = Math.max(m === 9 ? 1 : 2, Math.round(estimates * (0.26 + ((m * 3 + ci) % 5) * 0.03)));
      return [c, { leads, estimates, sold, soldValue: Math.round((sold * AVG_JOB[c] * (0.85 + ((m + ci * 2) % 6) * 0.06)) / 100) * 100 }];
    }),
  ) as Record<Channel, ChannelMonth>;
  return { month: `2026-${String(m + 1).padStart(2, "0")}`, channels };
});
