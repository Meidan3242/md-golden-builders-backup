"""Simulation: fill the owner's Form 203 + generate Additional Description pages + sign tags."""
import io, sys
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color, HexColor, black

FORM, LOGO, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
WATERMARK, SCRIPT_TTF = sys.argv[4], sys.argv[5]
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("Script", SCRIPT_TTF))
SIGNED_AT = "10/11/2026 9:14 AM PT"
W, H = 612, 1008
BLUE = HexColor("#1f3a8a")
GOLD = HexColor("#d09028")

C = dict(name="MD Golden Builders", lic="CSLB #1128874", addr="4275 Mission Bay Dr #359", city="San Diego, CA 92109",
         phone="(858) 933-1694", email="info@mdgoldenbuilders.com")
O = dict(name="Daniel & Sarah Whitman (SAMPLE)", addr="1450 Palm Ridge Dr", city="San Diego, CA 92117",
         phone="(619) 555-0148", email="whitman.sample@example.com")
DATE = "October 11, 2026"
PRICE = 35000
SCHEDULE = [  # (amount, description, date/trigger)
    (3500, "Architectural & structural plans completed", "Upon plans"),
    (1500, "Plans submitted to the City of San Diego", "Upon submittal"),
    (11000, "Demolition, excavation & footing forms/rebar", "Upon start"),
    (12000, "Footings poured & 50 LF CMU wall built", "Upon wall"),
    (6000, "Stucco finish, final inspection & clean-up", "Completion"),
]
assert 1000 + sum(a for a, *_ in SCHEDULE) == PRICE

def t(c, x, ytop, s, size=9, color=BLUE, font="Helvetica"):
    c.setFillColor(color); c.setFont(font, size); c.drawString(x, H - ytop, s)

def tag(c, x, ytop, w, label, optional=False):
    """Yellow 'sign here' flag; ytop = baseline line (top-origin)."""
    h = 13
    c.setFillColor(Color(1, 0.84, 0.3, alpha=0.55 if not optional else 0.25))
    c.setStrokeColor(GOLD); c.setLineWidth(0.8)
    if optional: c.setDash(2, 2)
    c.roundRect(x, H - ytop, w, h, 2, fill=1, stroke=1); c.setDash()
    c.setFillColor(HexColor("#7a4b00")); c.setFont("Helvetica-Bold", 7)
    c.drawString(x + 3, H - ytop + 4, label)

def esign(c, x, ytop, text="Meidan Deuitsch", size=17, caption=True):
    """Contractor signature spot. Contracts are never sent pre-signed — the box stays empty."""
    return
    c.setFillColor(HexColor("#0b2a6b")); c.setFont("Script", size); c.drawString(x, H - ytop, text)
    if caption:
        c.setFont("Helvetica", 5.5); c.setFillColor(HexColor("#4a6fa5"))
        c.drawString(x, H - ytop + size * 0.9, f"e-signed {SIGNED_AT} · ID 7F3A-21C9")

def overlay(page_no):
    buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(W, H))
    if page_no == 1:
        # parties
        for (x, y, s) in [(70, 123, C["lic"]), (70, 142, C["addr"]), (70, 160, C["city"]),
                          (70, 179, C["phone"]), (70, 199, C["email"]),
                          (350, 105, O["name"]), (350, 123, O["addr"]), (350, 142, O["city"]), (350, 160, O["phone"]),
                          (350, 179, "none"), (350, 199, O["email"])]:
            t(c, x, y, s)
        t(c, 255, 222, "1450 Palm Ridge Dr"); t(c, 430, 223, "San Diego, CA 92117")
        t(c, 200, 242, "none")
        t(c, 340, 290, "50 LF reinforced CMU garden wall with concrete footings,")
        for i, line in enumerate(["engineered plans & City permit processing, smooth stucco finish, drainage weep holes,",
                                  "inspections and full clean-up. Full scope of work, materials, exclusions and payment",
                                  "schedule: see ADDITIONAL DESCRIPTION (2 pages), incorporated into this contract."]):
            t(c, 40, 311 + i * 20, line)
        t(c, 330, 412, "Start of demolition / excavation")
        t(c, 150, 428, "Dec 1, 2026 (after permit)"); t(c, 445, 428, "Jan 15, 2027")
        t(c, 160, 447, "$35,000.00", 10, font="Helvetica-Bold"); t(c, 420, 447, "$1,000.00", 10, font="Helvetica-Bold")
        t(c, 310, 488, "none")
        for i, (amt, desc, when) in enumerate(SCHEDULE):
            y = 588 + i * 17
            t(c, 60, y, f"{amt:,.2f}", 8); t(c, 110, y, desc, 7.5); t(c, 340, y, when, 7)
        t(c, 440, 696, "none", 8)
        t(c, 430, 723, "Additional Description (2 pp.)", 7.5)
        # signature / initial spots
        tag(c, 486, 751, 70, "INITIAL")
        t(c, 190, 764, "N/A — under 65", 8); tag(c, 300, 766, 70, "INITIAL")
        tag(c, 39, 798, 34, "INIT.")
        tag(c, 455, 798, 34, "INIT.", optional=True)
        tag(c, 46, 916, 175, "SIGN HERE — OWNER"); t(c, 245, 913, "date", 7)
        tag(c, 46, 939, 175, "SIGN — 2ND OWNER (if any)", optional=True)
        t(c, 350, 913, "MD Golden Builders")
        esign(c, 410, 935, caption=False)
        t(c, 70, 972, "Meidan Deuitsch")
    elif page_no == 3:
        t(c, 50, 405, O["name"]); t(c, 410, 405, DATE, 8)
        tag(c, 404, 427, 110, "SIGN HERE — OWNER")
        for y in (643, 917):
            t(c, 400, y, "Oct 15, 2026", 8)
            t(c, 60, y + 23, C["name"], 8); t(c, 330, y + 23, "4275 Mission Bay Dr #359, San Diego CA 92109", 7)
        t(c, 66, 478, DATE, 7); t(c, 66, 743, DATE, 7)
    elif page_no == 5:
        for y in (409, 818):
            esign(c, 215, y - 2, "MD", 15)
            tag(c, 470, y, 70, "OWNER INIT.", optional=True)
        t(c, 90, 958, O["name"], 8)
        tag(c, 300, 960, 140, "SIGN HERE — OWNER"); t(c, 505, 958, "date", 7)
    c.save(); buf.seek(0)
    return PdfReader(buf).pages[0]

def additional_pages():
    buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(W, H))
    DARK = HexColor("#1a1a1a"); BROWN = HexColor("#7a4b00"); SOFT = HexColor("#fbf3e2"); RULE = HexColor("#d9d2c3")
    scope = [
        ("PLANS & PERMIT", ["Site measure and survey of the wall location.",
            "Architectural / structural plans by a licensed engineer (footing design, rebar, wall height up to 4 ft).",
            "Submit plans to the City of San Diego and respond to plan-check corrections until approval.",
            "City permit and plan-check fees are billed at cost (not included in the contract price)."]),
        ("DEMOLITION & SITE PREPARATION", ["Remove existing landscape edging, plants and debris along the 50 ft wall line.",
            "Excavate for new footings per approved plans; haul away excess soil and debris.",
            "Protect existing hardscape, irrigation lines and adjacent property during the work."]),
        ("CONCRETE FOOTINGS", ["Form, set rebar and pour reinforced concrete footings per approved plans.",
            "Coordinate and pass the City footing inspection before the pour."]),
        ("CMU GARDEN WALL — 50 LINEAR FEET", ["Build approx. 50 LF of 8\" concrete block (CMU) garden wall, up to 4 ft high.",
            "Vertical and horizontal rebar and grout per plans; weep holes for drainage.",
            "Precast concrete cap on top of the wall; coordinate in-progress City inspections."]),
        ("STUCCO FINISH", ["3-coat stucco system, smooth finish, standard color selected by the Owner.",
            "Clean lines and a uniform appearance on both faces of the wall."]),
        ("CLEAN-UP & COMPLETION", ["Final City inspection and sign-off.",
            "Remove all construction debris and leave the work area broom-clean."]),
    ]
    exclusions = ["Irrigation relocation beyond 10 ft of the wall line", "Electrical / lighting", "Landscaping & planting",
                  "Unforeseen underground obstructions (rock, utilities) — by written Change Order",
                  "City permit / plan-check fees (billed at cost)"]
    L, R = 46, 566

    def frame(pg):
        c.drawImage(WATERMARK, 106, 330, width=400, height=240, mask="auto", preserveAspectRatio=True)
        c.setStrokeColor(GOLD); c.setLineWidth(2); c.rect(24, 24, W - 48, H - 48)
        c.setStrokeColor(DARK); c.setLineWidth(0.5); c.rect(29, 29, W - 58, H - 58)
        # header
        c.drawImage(LOGO, L, H - 112, width=118, height=72, mask="auto", preserveAspectRatio=True)
        c.setFillColor(DARK); c.setFont("Times-Bold", 18); c.drawCentredString(318, H - 66, "ADDITIONAL DESCRIPTION")
        c.setFont("Times-Italic", 9); c.setFillColor(HexColor("#444444"))
        c.drawCentredString(318, H - 80, "Attachment to Home Improvement Contract (California Form 203)")
        c.drawCentredString(318, H - 92, "Incorporated into and made part of the Contract")
        c.setStrokeColor(DARK); c.setLineWidth(0.6); c.rect(468, H - 106, 98, 56)
        c.setFont("Helvetica", 6.5); c.setFillColor(HexColor("#555555"))
        for i, (k, v) in enumerate([("CONTRACT NO.", "2026-041"), ("DATE", "10/11/2026"), ("PAGE", f"{pg} of 2")]):
            c.drawString(473, H - 60 - i * 17, k); c.setFont("Helvetica-Bold", 8.5); c.setFillColor(DARK)
            c.drawRightString(561, H - 60 - i * 17, v); c.setFont("Helvetica", 6.5); c.setFillColor(HexColor("#555555"))
        c.setStrokeColor(GOLD); c.setLineWidth(1.5); c.line(L, H - 120, R, H - 120)
        # parties table
        top = H - 128; h = 58
        c.setStrokeColor(DARK); c.setLineWidth(0.5); c.rect(L, top - h, R - L, h); c.line(306, top, 306, top - h)
        c.setFillColor(SOFT); c.rect(L, top - 12, R - L, 12, fill=1, stroke=1)
        c.setFillColor(BROWN); c.setFont("Helvetica-Bold", 7.5)
        c.drawString(L + 5, top - 9, "DIRECT CONTRACTOR"); c.drawString(311, top - 9, "PROPERTY OWNER / PROJECT")
        c.setFillColor(DARK); c.setFont("Helvetica", 8)
        for i, v in enumerate([C["name"] + " · " + C["lic"], C["addr"] + ", " + C["city"], C["phone"] + " · " + C["email"]]):
            c.drawString(L + 5, top - 24 - i * 11, v)
        for i, v in enumerate([O["name"], O["addr"] + ", " + O["city"], O["phone"] + " · " + O["email"]]):
            c.drawString(311, top - 24 - i * 11, v)
        return top - h - 18

    def section_title(y, num, title):
        c.setFillColor(SOFT); c.setStrokeColor(RULE); c.rect(L, y - 4, R - L, 15, fill=1, stroke=1)
        c.setFillColor(GOLD); c.rect(L, y - 4, 4, 15, fill=1, stroke=0)
        c.setFillColor(BROWN); c.setFont("Helvetica-Bold", 9); c.drawString(L + 10, y + 0.5, f"{num}.  {title}")
        return y - 17

    def ruled_item(y, label, text):
        c.setFillColor(DARK); c.setFont("Helvetica-Bold", 8); c.drawString(L + 10, y, label)
        c.setFont("Times-Roman", 9.5); c.drawString(L + 34, y, text)
        c.setStrokeColor(RULE); c.setLineWidth(0.4); c.line(L + 8, y - 4, R, y - 4)
        return y - 14

    def footer(pg):
        c.setFont("Helvetica", 6.5); c.setFillColor(HexColor("#666666"))
        c.drawString(L, 38, f"{C['name']} · {C['lic']} · {C['addr']}, {C['city']} · {C['phone']}")
        c.drawRightString(R, 38, f"Additional Description · Page {pg} of 2")
        # initials boxes
        c.setStrokeColor(DARK); c.setLineWidth(0.5)
        c.drawString(L, 54, "Contractor initials"); c.rect(L + 62, 50, 34, 14); esign(c, L + 68, H - 53, "MD", 12, caption=False)
        c.setFont("Helvetica", 6.5); c.setFillColor(HexColor("#666666")); c.drawString(R - 106, 54, "Owner initials"); c.rect(R - 56, 50, 56, 14)
        tag(c, R - 55, H - 51 - 0, 54, "INITIAL")

    def signatures(y):
        c.setStrokeColor(DARK); c.setLineWidth(0.6); c.rect(L, y - 74, R - L, 74); c.line(306, y, 306, y - 74)
        c.setFillColor(SOFT); c.rect(L, y - 12, R - L, 12, fill=1, stroke=1)
        c.setFillColor(BROWN); c.setFont("Helvetica-Bold", 7.5)
        c.drawString(L + 5, y - 9, "DIRECT CONTRACTOR"); c.drawString(311, y - 9, "OWNER(S)")
        c.setStrokeColor(DARK)
        for x0 in (L + 5, 311):
            c.line(x0, y - 44, x0 + 160, y - 44); c.line(x0 + 175, y - 44, x0 + 245, y - 44)
            c.setFont("Helvetica", 6.5); c.setFillColor(HexColor("#555555"))
            c.drawString(x0, y - 52, "Signature"); c.drawString(x0 + 175, y - 52, "Date")
        c.setFillColor(DARK); c.setFont("Helvetica", 7.5)
        c.drawString(L + 5, y - 66, "Meidan Deuitsch, Owner — MD Golden Builders"); c.drawString(311, y - 66, O["name"])
        esign(c, L + 10, H - (y - 40))
        tag(c, 316, H - (y - 42), 150, "SIGN HERE — OWNER")

    # ---- page 1: scope
    y = frame(1)
    c.setFillColor(DARK); c.setFont("Times-Bold", 12)
    c.drawString(L, y, "SCOPE OF WORK — 50 LF CMU Garden Wall, incl. Footings & Engineered Plans"); y -= 10
    c.setFont("Times-Italic", 8.5); c.setFillColor(HexColor("#444444"))
    c.drawString(L, y - 6, "Contractor will furnish all labor, materials and equipment to complete the following work in a good, workmanlike manner:"); y -= 26
    for i, (title, items) in enumerate(scope, 1):
        y = section_title(y, i, title)
        for j, it in enumerate(items, 1):
            y = ruled_item(y, f"{i}.{j}", it)
        y -= 7
    y = section_title(y, len(scope) + 1, "EXCLUSIONS — NOT INCLUDED IN THIS CONTRACT")
    for j, it in enumerate(exclusions, 1):
        y = ruled_item(y, f"{len(scope) + 1}.{j}", it)
    footer(1); c.showPage()

    # ---- page 2: price & payments
    y = frame(2)
    c.setStrokeColor(GOLD); c.setLineWidth(1.2); c.setFillColor(SOFT); c.rect(L, y - 30, R - L, 34, fill=1, stroke=1)
    c.setFillColor(DARK); c.setFont("Times-Bold", 15); c.drawString(L + 10, y - 18, "CONTRACT PRICE")
    c.drawRightString(R - 10, y - 18, "$35,000.00"); y -= 52
    c.setFont("Times-Bold", 11); c.drawString(L, y, "SCHEDULE OF PAYMENTS"); y -= 8
    rows = [(1000, "Down payment — upon signing of this contract")] + [(a, d) for a, d, _ in SCHEDULE]
    c.setStrokeColor(DARK); c.setLineWidth(0.5)
    c.setFillColor(DARK); c.rect(L, y - 16, R - L, 16, fill=1, stroke=1)
    c.setFillColor(HexColor("#ffffff")); c.setFont("Helvetica-Bold", 8)
    c.drawString(L + 6, y - 11, "NO."); c.drawString(L + 40, y - 11, "PAYMENT DUE UPON COMPLETION OF"); c.drawRightString(R - 6, y - 11, "AMOUNT")
    y -= 16
    for i, (amt, d) in enumerate(rows, 1):
        c.setFillColor(HexColor("#ffffff") if i % 2 else HexColor("#faf7f0")); c.rect(L, y - 18, R - L, 18, fill=1, stroke=1)
        c.setFillColor(DARK); c.setFont("Helvetica", 8.5); c.drawString(L + 10, y - 12, str(i))
        c.setFont("Times-Roman", 10); c.drawString(L + 40, y - 12, d)
        c.setFont("Helvetica-Bold", 9); c.drawRightString(R - 6, y - 12, f"${amt:,.2f}")
        y -= 18
    c.setFillColor(SOFT); c.rect(L, y - 20, R - L, 20, fill=1, stroke=1)
    c.setFillColor(DARK); c.setFont("Helvetica-Bold", 10); c.drawString(L + 40, y - 14, "TOTAL CONTRACT PRICE"); c.drawRightString(R - 6, y - 14, "$35,000.00")
    y -= 40
    c.setFont("Times-Bold", 11); c.drawString(L, y, "TERMS"); y -= 14
    c.setFont("Times-Roman", 9.5)
    for line in ["Each progress payment is due only after the described work has been completed. The down payment does not",
                 "exceed $1,000 or 10% of the contract price, whichever is less. Any change to the scope, price or schedule",
                 "requires a written Change Order signed by both parties. Payment methods: Zelle (payments@example.com),",
                 "Venmo, check payable to MD Golden Builders, cash, or card through a secure Square link (processing fee applies)."]:
        c.drawString(L, y, line); y -= 12
    y -= 6
    c.setFont("Times-Bold", 11); c.drawString(L, y, "WARRANTY"); y -= 14
    c.setFont("Times-Roman", 9.5)
    c.drawString(L, y, "Contractor warrants its workmanship for five (5) years from the date of completion, issued with the Completion Form.")
    y -= 30
    signatures(y)
    footer(2); c.showPage()
    c.save(); buf.seek(0)
    return PdfReader(buf).pages

form = PdfReader(FORM); out = PdfWriter()
for i, p in enumerate(form.pages, 1):
    if i in (1, 3, 5): p.merge_page(overlay(i))
    out.add_page(p)
for p in additional_pages(): out.add_page(p)
# sample watermark note on every page
with open(OUT, "wb") as f: out.write(f)
print("ok", len(out.pages), "pages")
