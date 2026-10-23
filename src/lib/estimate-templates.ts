// Starting points for an estimate, one per trade. Pick one, fix the prices, adjust the wording, send.
export type EstimateSection = { title: string; items: string[]; price: number };
export type EstimateStage = { name: string; pct: number }; // % of the amount after the deposit
export type EstimateTemplate = { key: string; label: string; title: string; sections: EstimateSection[]; exclusions: string[]; schedule: EstimateStage[] };

const s = (title: string, items: string[]): EstimateSection => ({ title, items, price: 0 });
const PERMITS = "Permit, plan-check and engineering fees (billed at cost)";
const STANDARD: EstimateStage[] = [
  { name: "Upon start of work", pct: 30 },
  { name: "Upon rough-in / framing complete", pct: 30 },
  { name: "Upon finishes installed", pct: 30 },
  { name: "Project completion", pct: 10 },
];

export const ESTIMATE_TEMPLATES: EstimateTemplate[] = [
  {
    key: "adu", label: "ADU", title: "New detached ADU",
    sections: [
      s("Plans & permits", ["Architectural and structural plans", "Title 24 energy report", "Submit and manage the permit with the City"]),
      s("Site work & foundation", ["Layout, excavation and grading", "Reinforced concrete foundation per plans", "Underground plumbing and utility trenching"]),
      s("Framing & roof", ["Wall and roof framing per plans", "Sheathing, windows and exterior doors", "Roofing system"]),
      s("Plumbing, electrical & HVAC", ["New electrical panel / sub-panel and wiring", "Supply and drain plumbing", "Mini-split heating and cooling"]),
      s("Insulation & drywall", ["Insulation per Title 24", "Drywall hang, tape and texture"]),
      s("Finishes", ["Kitchen cabinets, countertops and fixtures", "Bathroom tile, vanity and fixtures", "Flooring, interior doors, trim and paint", "Exterior stucco and paint"]),
    ],
    exclusions: [PERMITS, "Utility company fees and new meters", "Appliances unless listed", "Landscaping"],
    schedule: [{ name: "Upon permit issued / start", pct: 15 }, { name: "Upon foundation complete", pct: 20 }, { name: "Upon framing complete", pct: 20 }, { name: "Upon rough-ins & insulation", pct: 20 }, { name: "Upon drywall & finishes", pct: 15 }, { name: "Final inspection / completion", pct: 10 }],
  },
  {
    key: "garage", label: "Garage Conversion", title: "Garage conversion to living space",
    sections: [
      s("Plans & permits", ["Plans for the conversion", "Submit and manage the permit with the City"]),
      s("Demo & floor", ["Remove garage door and frame the new wall", "Raise / level the floor and add moisture barrier"]),
      s("Framing, windows & doors", ["Frame new walls per plans", "New windows and entry door"]),
      s("Electrical, plumbing & HVAC", ["New outlets, lighting and circuits", "Plumbing if a bathroom / kitchenette is included", "Mini-split heating and cooling"]),
      s("Insulation, drywall & paint", ["Insulation per Title 24", "Drywall, texture and paint"]),
      s("Finishes", ["Flooring, baseboards and interior doors", "Exterior stucco patch and paint to match"]),
    ],
    exclusions: [PERMITS, "Appliances unless listed"], schedule: STANDARD,
  },
  {
    key: "kitchen", label: "Kitchen Remodel", title: "Kitchen remodel",
    sections: [
      s("Demolition", ["Remove existing cabinets, countertops and backsplash", "Protect floors and haul away debris"]),
      s("Plumbing & electrical", ["Relocate / update plumbing as needed", "New outlets, recessed lighting and circuits per code"]),
      s("Cabinets & countertops", ["Supply and install new cabinets", "Quartz countertops, templated and installed"]),
      s("Backsplash, paint & finish", ["Tile backsplash", "Drywall repair and paint", "Install sink, faucet and appliances"]),
    ],
    exclusions: [PERMITS, "Appliances (installation included)", "Flooring unless listed"], schedule: STANDARD,
  },
  {
    key: "bath", label: "Bathroom Remodel", title: "Full bathroom remodel",
    sections: [
      s("Protection & demolition", ["Protect floors and the path to the bathroom", "Remove the existing tub / shower, vanity, toilet, tile and drywall as needed", "Haul away all debris"]),
      s("Plumbing", ["New shower valve, trim and drain", "Relocate / update supply and drain lines for the new layout", "Install toilet, sink faucet and shower fixtures"]),
      s("Electrical & ventilation", ["New vanity lighting and recessed lights per code", "GFCI outlets", "New quiet exhaust fan vented to the exterior"]),
      s("Shower waterproofing & tile", ["Full waterproofing system (pan, walls and niche)", "Wall tile to the ceiling with a built-in niche", "Shower floor tile with proper slope to the drain"]),
      s("Bathroom floor", ["Level the subfloor", "Floor tile with matching baseboard / transitions"]),
      s("Vanity, countertop & glass", ["New vanity with quartz countertop and undermount sink", "Mirror, towel bars and accessories", "Frameless glass shower door"]),
      s("Drywall, paint & final clean", ["Moisture-resistant drywall where needed", "Prime and paint walls, ceiling and trim", "Final clean and walkthrough"]),
    ],
    exclusions: [PERMITS, "Fixtures, tile and vanity upgrades beyond the allowance we choose together", "Repairs to hidden water damage or framing (priced after demolition, with your approval)"],
    schedule: [{ name: "Upon start of demolition", pct: 30 }, { name: "Upon plumbing & electrical rough-in", pct: 25 }, { name: "Upon tile installed", pct: 30 }, { name: "Project completion", pct: 15 }],
  },
  {
    key: "addition", label: "Room Addition", title: "Room addition",
    sections: [
      s("Plans & permits", ["Architectural and structural plans", "Submit and manage the permit with the City"]),
      s("Foundation", ["Excavation and reinforced concrete foundation"]),
      s("Framing & roof", ["Framing, tie-in to the existing roof, roofing"]),
      s("Systems", ["Electrical, plumbing and HVAC as needed"]),
      s("Finishes", ["Insulation, drywall, flooring, trim and paint", "Exterior stucco to match"]),
    ],
    exclusions: [PERMITS], schedule: STANDARD,
  },
  {
    key: "full", label: "Full Home Remodel", title: "Full home remodel",
    sections: [
      s("Demolition", ["Interior demolition per scope", "Haul away debris"]),
      s("Systems", ["Electrical and plumbing updates per code"]),
      s("Kitchen", ["Cabinets, countertops, backsplash and fixtures"]),
      s("Bathrooms", ["Tile, vanities and fixtures"]),
      s("Flooring, paint & finish", ["Flooring throughout", "Interior doors, trim and paint"]),
    ],
    exclusions: [PERMITS, "Appliances unless listed"], schedule: STANDARD,
  },
  {
    key: "wall", label: "Retaining Wall", title: "New retaining wall",
    sections: [
      s("Demolition & site preparation", ["Remove existing wall in the work area", "Excavate for footings per the approved plans", "Haul away debris and excess soil"]),
      s("Concrete footings", ["Reinforced concrete footings per plans and code", "Pass the City footing inspection"]),
      s("Block wall", ["CMU block wall with rebar and grout per plans", "Drainage behind the wall"]),
      s("Finish", ["Stucco or cap finish as selected"]),
    ],
    exclusions: [PERMITS], schedule: [{ name: "Upon start of demo", pct: 40 }, { name: "Upon footings installed", pct: 40 }, { name: "Upon finish", pct: 10 }, { name: "Project completion", pct: 10 }],
  },
  {
    key: "pavers", label: "Pavers & Hardscape", title: "Pavers & hardscape",
    sections: [
      s("Demolition & excavation", ["Remove existing surface", "Excavate and haul away soil"]),
      s("Base", ["Compacted road base and sand bed"]),
      s("Pavers", ["Supply and install pavers in the selected pattern", "Edge restraints, joint sand and clean-up"]),
    ],
    exclusions: ["Irrigation changes unless listed"], schedule: [{ name: "Upon start of work", pct: 50 }, { name: "Upon base complete", pct: 30 }, { name: "Project completion", pct: 20 }],
  },
  {
    key: "concrete", label: "Concrete & Driveway", title: "Concrete driveway",
    sections: [
      s("Demolition", ["Break out and haul away the existing concrete"]),
      s("Base & forms", ["Grade, compact base, forms and rebar"]),
      s("Concrete", ["Pour, finish and saw-cut control joints"]),
    ],
    exclusions: [PERMITS], schedule: [{ name: "Upon demolition", pct: 40 }, { name: "Upon forms & rebar", pct: 40 }, { name: "Project completion", pct: 20 }],
  },
  {
    key: "patio", label: "Patio & Deck", title: "Patio cover / deck",
    sections: [
      s("Footings", ["Concrete footings per plans"]),
      s("Framing", ["Posts, beams and joists per plans"]),
      s("Decking / roof", ["Decking or patio-cover roof as selected"]),
      s("Finish", ["Stain / paint and clean-up"]),
    ],
    exclusions: [PERMITS, "Electrical unless listed"], schedule: STANDARD,
  },
  {
    key: "stucco", label: "Stucco & Exterior", title: "Exterior stucco",
    sections: [
      s("Preparation", ["Protect windows, doors and landscaping", "Repair damaged areas"]),
      s("Stucco", ["Stucco system / color coat as selected"]),
      s("Paint & clean-up", ["Exterior paint as selected", "Clean-up and haul away debris"]),
    ],
    exclusions: [], schedule: [{ name: "Upon start of work", pct: 50 }, { name: "Upon stucco complete", pct: 40 }, { name: "Project completion", pct: 10 }],
  },
  {
    key: "flooring", label: "Flooring", title: "New flooring",
    sections: [
      s("Removal & preparation", ["Remove and haul away existing flooring", "Level and prepare the subfloor"]),
      s("Installation", ["Supply and install the selected flooring", "Baseboards and transitions"]),
    ],
    exclusions: ["Moving furniture and appliances"], schedule: [{ name: "Upon start of work", pct: 50 }, { name: "Project completion", pct: 50 }],
  },
  {
    key: "blank", label: "Blank", title: "",
    sections: [s("", [])], exclusions: [], schedule: STANDARD,
  },
];
