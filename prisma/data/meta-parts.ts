import { Manufacturer, PartType } from "@prisma/client";

export type MetaPartSeed = {
  slug: string;
  name: string;
  type: PartType;
  manufacturer: Manufacturer;
  weightGrams: string;
  metaTier: "S" | "A" | "B";
  notes: string;
};

/**
 * Competitive Beyblade X parts sourced from BeyBase, BeyCase, and WBO meta reports
 * (Spring 2025–2026). Weights approximate Takara Tomy community measurements.
 */
export const metaParts: MetaPartSeed[] = [
  // ── S-tier blades ──────────────────────────────────────────────────────────
  {
    slug: "wizard-rod",
    name: "Wizard Rod",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "35.30",
    metaTier: "S",
    notes: "#1 meta defense/stamina blade. Staple on 1-60 Hexa, 9-60 Free Ball, 1-60 Low Orb."
  },
  {
    slug: "shark-scale",
    name: "Shark Scale",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "36.20",
    metaTier: "S",
    notes: "Top attack blade. Dominant on 3-60 Low Rush, 1-60 Rush, 9-60 Ball stamina variants."
  },
  {
    slug: "cobalt-dragoon",
    name: "Cobalt Dragoon",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "37.80",
    metaTier: "S",
    notes: "Left-spin staple. Best on 5-60/9-60 Elevate for burst-resistant stamina and spin equalization."
  },
  {
    slug: "meteor-dragoon",
    name: "Meteor Dragoon",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "37.10",
    metaTier: "S",
    notes: "Left-spin equalizer. 9-60 Elevate is the premier stamina counter to right-spin Wizard Rod builds."
  },
  {
    slug: "aero-pegasus",
    name: "Aero Pegasus",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "35.80",
    metaTier: "S",
    notes: "Height-versatile attacker. Meta on 1-60 through 7-60 Rush and Level setups."
  },
  {
    slug: "hover-wyvern",
    name: "Hover Wyvern",
    type: "BLADE",
    manufacturer: "HASBRO",
    weightGrams: "34.50",
    metaTier: "S",
    notes: "Hasbro-exclusive attack blade with strong Over/Xtreme Zone reversal. Pairs with 1-60/1-70 Rush."
  },
  {
    slug: "emperor-blast-heavy",
    name: "Emperor Blast Heavy",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "45.20",
    metaTier: "S",
    notes: "CX heavy attacker (~45 g). Reliable on 7-60 Rush; costly but tournament-proven."
  },

  // ── A-tier blades ──────────────────────────────────────────────────────────
  {
    slug: "phoenix-wing",
    name: "Phoenix Wing",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "38.52",
    metaTier: "A",
    notes: "Heavy right-spin attacker. Strong on 1-60 Low Rush and 7-60 Level."
  },
  {
    slug: "clock-mirage",
    name: "Clock Mirage",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.40",
    metaTier: "A",
    notes: "Ultimate stamina counterpick. Best on 4-55 Under Needle; fragile but near-guaranteed outspins."
  },
  {
    slug: "dran-buster",
    name: "Dran Buster",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "36.10",
    metaTier: "A",
    notes: "Aggressive UX attacker. Excels on 1-60 Low Rush for low-profile ratchet contact."
  },
  {
    slug: "shark-edge",
    name: "Shark Edge",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.18",
    metaTier: "A",
    notes: "Classic attack blade. Low Rush variant delivers extreme low-height aggression."
  },
  {
    slug: "impact-drake",
    name: "Impact Drake",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "36.50",
    metaTier: "A",
    notes: "Burst-focused attacker. Common on 9-60 Low Rush in aggressive decks."
  },
  {
    slug: "tyranno-beat",
    name: "Tyranno Beat",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "35.60",
    metaTier: "A",
    notes: "70-height specialist. Benefits from 4-70 and 1-70 ratchets for extended precession."
  },
  {
    slug: "silver-wolf",
    name: "Silver Wolf",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.20",
    metaTier: "A",
    notes: "Defensive stamina blade. Staple on 9-60 Under Needle in control-oriented decks."
  },

  // ── B-tier blades (still tournament-relevant) ───────────────────────────────
  {
    slug: "dran-sword",
    name: "Dran Sword",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "35.42",
    metaTier: "B",
    notes: "BX-01 starter blade. Reliable baseline attacker on 3-60 Flat."
  },
  {
    slug: "hells-scythe",
    name: "Hells Scythe",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.91",
    metaTier: "B",
    notes: "Stamina-leaning blade. Solid on 9-60 Ball for control play."
  },
  {
    slug: "wizard-arrow",
    name: "Wizard Arrow",
    type: "BLADE",
    manufacturer: "HASBRO",
    weightGrams: "32.77",
    metaTier: "B",
    notes: "Light defensive blade. Budget-friendly Hasbro option for 4-60 Point builds."
  },

  // ── Meta ratchets ──────────────────────────────────────────────────────────
  {
    slug: "ratchet-1-60",
    name: "1-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.18",
    metaTier: "S",
    notes: "Lowest standard ratchet. Core for Wizard Rod Hexa, Shark Scale Rush, Aero Pegasus."
  },
  {
    slug: "ratchet-3-60",
    name: "3-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.28",
    metaTier: "S",
    notes: "Most common attack ratchet. Shark Scale 3-60 Low Rush is the era-defining combo."
  },
  {
    slug: "ratchet-9-60",
    name: "9-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.56",
    metaTier: "S",
    notes: "9-sided burst-resistant ratchet. Preferred over 5-60 for Cobalt Dragoon Elevate."
  },
  {
    slug: "ratchet-7-60",
    name: "7-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.48",
    metaTier: "S",
    notes: "Stability ratchet for CX and heavy blades. Emperor Blast Heavy 7-60 Rush staple."
  },
  {
    slug: "ratchet-4-55",
    name: "4-55",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.05",
    metaTier: "A",
    notes: "Simple-type ratchet for Clock Mirage stamina builds. Pairs with Under Needle."
  },
  {
    slug: "ratchet-5-60",
    name: "5-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.41",
    metaTier: "A",
    notes: "Balanced ratchet. Cobalt Dragoon 5-60 Elevate classic, though 9-60 is safer now."
  },
  {
    slug: "ratchet-1-70",
    name: "1-70",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.72",
    metaTier: "A",
    notes: "70-height ratchet for Shark Scale Low Rush and Hover Wyvern attack variants."
  },
  {
    slug: "ratchet-4-60",
    name: "4-60",
    type: "RATCHET",
    manufacturer: "HASBRO",
    weightGrams: "6.12",
    metaTier: "B",
    notes: "Common Hasbro ratchet. Used in budget defense and balance builds."
  },
  {
    slug: "ratchet-3-80",
    name: "3-80",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.85",
    metaTier: "B",
    notes: "Tall ratchet for specific stamina and defense tuning."
  },

  // ── Meta bits ──────────────────────────────────────────────────────────────
  {
    slug: "bit-hexa",
    name: "Hexa",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.35",
    metaTier: "S",
    notes: "Current #1 competitive bit. Wizard Rod 1-60 Hexa dominates the 2026 meta."
  },
  {
    slug: "bit-low-rush",
    name: "Low Rush",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.28",
    metaTier: "S",
    notes: "Low-profile attack bit. Core for Shark Scale, Phoenix Wing, and Dran Buster combos."
  },
  {
    slug: "bit-elevate",
    name: "Elevate",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.42",
    metaTier: "S",
    notes: "Wide-base stamina bit. Cobalt/Meteor Dragoon staple; thick-shaft mold preferred."
  },
  {
    slug: "bit-rush",
    name: "Rush",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.31",
    metaTier: "S",
    notes: "Controlled attack movement. Safer than Low Rush; pairs with Aero Pegasus and Emperor Blast."
  },
  {
    slug: "bit-free-ball",
    name: "Free Ball",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.15",
    metaTier: "S",
    notes: "Premium stamina bit. Wizard Rod 9-60 Free Ball is a top defensive variant."
  },
  {
    slug: "bit-level",
    name: "Level",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.26",
    metaTier: "A",
    notes: "Balance bit for anti-meta play. Strong on Aero Pegasus and Phoenix Wing 7-60."
  },
  {
    slug: "bit-low-orb",
    name: "Low Orb",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.20",
    metaTier: "A",
    notes: "Defensive stamina bit. Wizard Rod 1-60 Low Orb is a tournament-winning setup."
  },
  {
    slug: "bit-ball",
    name: "Ball",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.09",
    metaTier: "A",
    notes: "Classic stamina bit. Wizard Rod 3-60 Ball and Shark Scale 9-60 Ball stamina variants."
  },
  {
    slug: "bit-under-needle",
    name: "Under Needle",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.18",
    metaTier: "A",
    notes: "Low stamina needle bit. Clock Mirage 4-55 Under Needle and Silver Wolf 9-60 builds."
  },
  {
    slug: "bit-kick",
    name: "Kick",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.33",
    metaTier: "A",
    notes: "Aggressive attack bit. Shark Scale 1-60 Kick for stamina-biased attack variants."
  },
  {
    slug: "bit-taper",
    name: "Taper",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.22",
    metaTier: "A",
    notes: "Stability bit for heavy blades. Emperor Blast Wheel/Heavy 9-60 Taper setups."
  },
  {
    slug: "bit-flat",
    name: "Flat",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.24",
    metaTier: "B",
    notes: "Standard attack bit from BX-01 Dran Sword. Reliable baseline for testing."
  },
  {
    slug: "bit-point",
    name: "Point",
    type: "BIT",
    manufacturer: "HASBRO",
    weightGrams: "2.17",
    metaTier: "B",
    notes: "Balanced movement bit. Common in Hasbro defense builds."
  }
];
