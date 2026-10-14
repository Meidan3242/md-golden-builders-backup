"""Build a real .eml of the welcome email (opens in Mail / Gmail / Outlook).

Usage: python3 tools/make_welcome_eml.py OUT.eml [CONTRACT.pdf] [LICENSE.jpg]
"""
import sys
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from pathlib import Path

out = Path(sys.argv[1])
contract = Path(sys.argv[2]) if len(sys.argv) > 2 else None
license_img = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(__file__).resolve().parent.parent / "public/license-cslb.jpg"

SCHEDULE = [
    ("Deposit — upon signing", 1000, True),
    ("Architectural & structural plans completed", 3500, False),
    ("Plans submitted to the City of San Diego", 1500, False),
    ("Demolition, excavation & footing forms/rebar", 11000, False),
    ("Footings poured & 50 LF CMU wall built", 12000, False),
    ("Stucco finish, final inspection & clean-up", 6000, False),
]
TRADES = ["ADU", "Garage Conversion", "Kitchen Remodel", "Bathroom Remodel", "Room Additions", "Full Home Remodel", "Retaining Walls", "Pavers & Hardscape", "Concrete & Driveways", "Patios & Decks", "Stucco & Exterior", "Flooring"]
TOTAL = sum(a for _, a, _ in SCHEDULE)
money = lambda n: f"${n:,.0f}"

text = f"""Hi Daniel and Sarah,

My name is Laline, and I'm the office manager here at MD Golden Builders. On behalf of Meidan and the whole team — welcome! We're really happy you chose us for your new garden wall, and we can't wait to get started.

I've attached a few things for your records:
- Your signed contract
- The scope of work — everything we'll build, step by step
- A copy of our contractor's license (CSLB #1128874)

Here's your payment schedule, so there are never any surprises:
""" + "\n".join(f"{i}. {n} — {money(a)}{' (received, thank you!)' if paid else ''}" for i, (n, a, paid) in enumerate(SCHEDULE, 1)) + f"""
Total: {money(TOTAL)}
I'll send you a short note each time we reach a step, and a receipt as soon as each payment comes in.

What's next: Meidan will text you in the next day or two to go over everything. Our plans go to the City of San Diego first, and once the permit is approved we're on site — right now we're looking at around December 1.

If anything comes up, just reply to this email or text me at (858) 332-2168 — I'm always happy to help.

Warmly,
Laline

Laline
Office Manager · MD Golden Builders
(858) 332-2168 · info@mdgoldenbuilders.com
CSLB #1128874 · 4275 Mission Bay Dr #359, San Diego, CA 92109

A LITTLE ABOUT US
We do everything ourselves, from A to Z — plans, permits, demolition, construction, finishes, final inspection and clean-up. One team, one contract, one number to call.
""" + " | ".join(TRADES) + "\n"

P = 'style="margin:0 0 14px"'
rows = "".join(
    f'<li style="margin:0 0 4px">{n} — <b>{money(a)}</b>{" <span style=color:#1a8f3c>(received, thank you!)</span>" if paid else ""}</li>'
    for n, a, paid in SCHEDULE
)
html = f"""<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1c1c1e;max-width:600px">
<p {P}>Hi Daniel and Sarah,</p>
<p {P}>My name is Laline, and I'm the office manager here at MD Golden Builders. On behalf of Meidan and the whole team — welcome! We're really happy you chose us for your new garden wall, and we can't wait to get started.</p>
<p {P}>I've attached a few things for your records:</p>
<ul style="margin:0 0 14px;padding-left:22px"><li>Your signed contract</li><li>The scope of work — everything we'll build, step by step</li><li>A copy of our contractor's license (CSLB #1128874)</li></ul>
<p {P}>Here's your payment schedule, so there are never any surprises:</p>
<ol style="margin:0 0 6px;padding-left:22px">{rows}</ol>
<p {P}><b>Total: {money(TOTAL)}</b><br>I'll send you a short note each time we reach a step, and a receipt as soon as each payment comes in.</p>
<p {P}><b>What's next:</b> Meidan will text you in the next day or two to go over everything. Our plans go to the City of San Diego first, and once the permit is approved we're on site — right now we're looking at around December 1.</p>
<p {P}>If anything comes up, just reply to this email or text me at (858) 332-2168 — I'm always happy to help.</p>
<p {P}>Warmly,<br>Laline</p>
<div style="border-top:1px solid #e5e5ea;padding-top:10px;font-size:13px;line-height:1.45;color:#3a3a3c">
<b style="color:#1c1c1e">Laline</b><br>Office Manager · MD Golden Builders<br>(858) 332-2168 · info@mdgoldenbuilders.com<br>
<span style="color:#8e8e93">CSLB #1128874 · 4275 Mission Bay Dr #359, San Diego, CA 92109</span></div>
<div style="margin-top:22px;background:#f7f4ec;border-radius:12px;padding:12px 16px;font-size:13px;line-height:1.5;color:#3a3a3c">
<b style="color:#1c1c1e">A little about us</b><br>
We do everything ourselves, from A to Z — plans, permits, demolition, construction, finishes, final inspection and clean-up. One team, one contract, one number to call.<br>
<b style="color:#1c1c1e;display:block;margin-top:6px">{" | ".join(TRADES)}</b></div>
</div>"""

msg = EmailMessage()
msg["From"] = "Laline - MD Golden Builders <CRM@mdgoldenbuilders.com>"
msg["To"] = "Daniel & Sarah Whitman <whitman.sample@example.com>"
msg["Subject"] = "Welcome to MD Golden Builders, Daniel!"
msg["Date"] = formatdate(localtime=True)
msg["Message-ID"] = make_msgid(domain="mdgoldenbuilders.com")
msg.set_content(text)
msg.add_alternative(html, subtype="html")
if contract and contract.exists():
    msg.add_attachment(contract.read_bytes(), maintype="application", subtype="pdf", filename="Whitman - Signed Contract.pdf")
msg.add_attachment(license_img.read_bytes(), maintype="image", subtype="jpeg", filename="MD Golden Builders - CSLB License 1128874.jpg")
out.write_bytes(bytes(msg))
print(out, out.stat().st_size)
