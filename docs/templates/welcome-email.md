# Welcome Email (sent automatically when the contract is fully signed)

**Subject:** Welcome to MD Golden Builders — your project is officially on the schedule!

Hi {{customer_first_name}},

Thank you for choosing **MD Golden Builders** for your {{project_type}} at
{{property_address}}. We're excited to get started and we're committed to making this
a smooth, transparent experience from the first day to the final walkthrough.

**Your signed contract is attached** for your records.

**Your payment schedule**

| # | Milestone | Amount | Due |
|---|-----------|--------|-----|
{{#each payment_milestones}}| {{index}} | {{name}} | {{amount}} | {{due_label}} |
{{/each}}
| | **Contract total** | **{{contract_total}}** | |

**What happens next**
1. {{owner_first_name}} will reach out by text within 1–2 business days to confirm the start date.
2. {{#if permit_required}}Plans will be submitted to {{jurisdiction}} for permits — we'll keep
   you updated at every step of the approval process.{{else}}We'll confirm material selections
   and lock in your start date.{{/if}}
3. Throughout the project you'll receive progress updates and photos.

**How to pay:** card (secure payment link), bank transfer (ACH), Zelle, or check.
Each invoice will include a payment link when the milestone is reached.

Questions at any time? Reply to this email or call/text us at **858-933-1694**.

Welcome to the MD Golden Builders family!

{{owner_full_name}}
MD Golden Builders · CSLB Lic. #1128874
4275 Mission Bay Drive #359, San Diego, CA 92109
858-933-1694 · info@mdgoldenbuilders.com
