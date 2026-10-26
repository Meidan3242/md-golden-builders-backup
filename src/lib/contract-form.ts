// The contract: Builder's Book Form 203 (5 pages, images in /public/forms) filled in from the approved estimate,
// plus our own "Additional Description" (scope of work + full payment schedule). Shared by the staff and customer pages.
import { COMPANY } from "./demo-docs";

export type ContractData = {
  estimateId: string;
  estimateNumber: number;
  owner: { name: string; street: string; cityStateZip: string; phone: string; email: string };
  workAddress: string;
  lender: string;
  title: string;
  sections: { title: string; items: string[]; price: number }[];
  exclusions: string[];
  price: number;
  downPayment: number;
  payments: { name: string; amount: number }[]; // progress payments, after the down payment
  commencement: string;
  startDate: string;
  completionDate: string;
  allowances: string;
  age65?: boolean; // set by us before sending: owner 65 or older → 5-day right to cancel
  arbitration?: boolean; // set by us before sending: the owner agreed to arbitration (voluntary)
};

export type ContractorSign = { name: string; initials: string; at: string; ip: string };
export type OwnerSign = { name: string; initials: string; age65: boolean; arbitration: boolean; at: string; ip: string; ua: string; cancelBy: string };

export const CONTRACTOR = {
  name: COMPANY.name,
  license: COMPANY.license.replace("CSLB ", "CSLB License "),
  street: "4275 Mission Bay Dr #359",
  city: "San Diego, CA 92109",
  phone: COMPANY.phone,
  email: COMPANY.email,
  salesman: "Meidan D.",
};

/** "100 Example Way, La Jolla, CA 92037" → street + "La Jolla, CA 92037". */
export function splitAddress(a: string) {
  const i = a.indexOf(",");
  return i < 0 ? { street: a.trim(), cityStateZip: "" } : { street: a.slice(0, i).trim(), cityStateZip: a.slice(i + 1).trim() };
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join("")
    .slice(0, 4);

/** The right-to-cancel deadline: N business days (Mon–Fri) after the signing day. */
export function cancelDeadline(signedDay: Date, businessDays: number) {
  const d = new Date(Date.UTC(signedDay.getUTCFullYear(), signedDay.getUTCMonth(), signedDay.getUTCDate()));
  let left = businessDays;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  d.setUTCHours(20); // midday in California, so the date reads the same there
  return d;
}

// Where things are written on the form, in pixels of the 935 × 1540 page images (y = the line the text sits on).
export const PAGE_W = 935;
export const PAGE_H = 1540;
export type Spot = { x: number; y: number; w: number };
const s = (x: number, y: number, w: number): Spot => ({ x, y, w });

export const P1 = {
  contractorName: s(60, 163, 385), license: s(60, 191, 385), contractorStreet: s(60, 219, 385), contractorCity: s(60, 247, 385), contractorPhone: s(60, 275, 385), contractorEmail: s(105, 307, 340),
  ownerName: s(492, 163, 386), ownerStreet: s(492, 191, 386), ownerCity: s(492, 219, 386), ownerPhone: s(492, 247, 386), ownerEmail: s(535, 307, 343),
  workAt: s(342, 342, 536), lender: s(302, 370, 576),
  desc: [s(522, 446, 356), s(57, 468, 821), s(57, 493, 821), s(57, 516, 821), s(57, 539, 821), s(57, 562, 821), s(57, 585, 821)],
  commencement: s(500, 630, 378), start: s(227, 658, 218), completion: s(677, 658, 201), price: s(227, 686, 218), down: s(642, 686, 236), finance: s(478, 750, 400),
  rows: [0, 1, 2, 3, 4].map((i) => ({ amount: s(92, 904 + 25.5 * i, 95), desc: s(205, 904 + 25.5 * i, 303) })),
  allowances: s(652, 1063, 226),
  receiptInitials: s(722, 1146, 156), age: s(277, 1170, 143), ageInitials: s(437, 1170, 153),
  box3: s(60, 1213, 46), box5: s(420, 1213, 46), boxArb: s(678, 1213, 46),
  ownerSign: s(72, 1398, 288), ownerDate: s(372, 1398, 66), firm: s(532, 1398, 346),
  contractorSign: s(602, 1436, 193), contractorDate: s(812, 1436, 66), salesman: s(102, 1483, 335),
};

export const P3 = {
  ackName: s(77, 615, 360), ackDate: s(622, 615, 118), check3: s(183, 652, 13), check5: s(398, 652, 13), ackSign: s(618, 655, 260),
  five: { date: s(97, 728, 125), by: s(590, 978, 223), seller: s(60, 1012, 393), at: s(482, 1012, 396) },
  three: { date: s(97, 1132, 125), by: s(590, 1397, 223), seller: s(60, 1428, 393), at: s(482, 1428, 396) },
};

export const P4 = { cglCheck: s(79, 405, 14), cglName: s(137, 403, 351), wcCheck: s(79, 728, 14) };

export const P5 = {
  arb: [618, 1244].map((y) => ({ contractor: s(267, y, 195), owner: s(688, y, 190) })),
  ackChecks: [0, 1, 2, 3, 4].flatMap((i) => [s(132, 1358 + 20 * i, 13), s(395, 1358 + 20 * i, 13)]),
  ownerPrint: s(120, 1463, 258), ownerSign: s(455, 1463, 263), ownerDate: s(747, 1463, 111),
};
