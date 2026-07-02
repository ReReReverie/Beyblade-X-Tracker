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
  },
  // ── Extra competitive blades ────────────────────────────────────────────────
  {
    slug: "cobalt-drake",
    name: "Cobalt Drake",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "38.00",
    metaTier: "S",
    notes: "Extremely heavy right-spin attacker, rare prize part. Dominant on 9-60 Flat or Rush."
  },
  {
    slug: "phoenix-rudder",
    name: "Phoenix Rudder",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "35.50",
    metaTier: "A",
    notes: "Stamina/defense UX blade with a smooth perimeter. Outstanding performance on 9-60 Glide or Hexa."
  },
  {
    slug: "hells-chain",
    name: "Hells Chain",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.50",
    metaTier: "A",
    notes: "Highly balanced 5-sided blade. Popular on 5-60 Point/Taper setups."
  },
  {
    slug: "dran-dagger",
    name: "Dran Dagger",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "35.10",
    metaTier: "A",
    notes: "6-winged attacker with high burst power. Excels on 3-60 Flat or Rush."
  },
  {
    slug: "whales-wave",
    name: "Whales Wave",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "36.50",
    metaTier: "A",
    notes: "Aggressive UX blade with strong smash attack. Best on 1-60/3-60 Flat or Low Rush."
  },
  {
    slug: "leon-claw",
    name: "Leon Claw",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "31.80",
    metaTier: "B",
    notes: "Lightweight blade with upper attack shape. Mostly used in niche combo testing."
  },
  {
    slug: "viper-tail",
    name: "Viper Tail",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.00",
    metaTier: "A",
    notes: "Downforce attacker/defender. Excellent destabilizer on 5-60 Orb/Needle."
  },
  {
    slug: "knight-shield",
    name: "Knight Shield",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "32.50",
    metaTier: "B",
    notes: "Classic defensive blade. Pairs well with 3-80/4-80 Needle for defense."
  },
  {
    slug: "knight-lance",
    name: "Knight Lance",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "33.50",
    metaTier: "B",
    notes: "Counter-attack specialist. Used on 4-80 Point or High Needle."
  },
  {
    slug: "lightning-l-drago",
    name: "Lightning L-Drago",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "36.80",
    metaTier: "A",
    notes: "Left-spin remake. Powerful smash attack on 1-60 Flat or Rush."
  },

  // ── Extra competitive ratchets ──────────────────────────────────────────────
  {
    slug: "ratchet-2-60",
    name: "2-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.20",
    metaTier: "A",
    notes: "Low profile, 2-sided ratchet. Concentrates weight on two opposite sides."
  },
  {
    slug: "ratchet-3-70",
    name: "3-70",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.50",
    metaTier: "B",
    notes: "Medium height, 3-sided ratchet."
  },
  {
    slug: "ratchet-5-70",
    name: "5-70",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.60",
    metaTier: "B",
    notes: "Medium height, 5-sided ratchet."
  },
  {
    slug: "ratchet-9-70",
    name: "9-70",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.70",
    metaTier: "A",
    notes: "Medium height, 9-sided burst resistant ratchet."
  },
  {
    slug: "ratchet-1-80",
    name: "1-80",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.55",
    metaTier: "B",
    notes: "Tall height, single-point weight distribution."
  },
  {
    slug: "ratchet-2-80",
    name: "2-80",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.40",
    metaTier: "B",
    notes: "Tall height, 2-sided ratchet."
  },
  {
    slug: "ratchet-4-80",
    name: "4-80",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.60",
    metaTier: "B",
    notes: "Tall height, 4-sided ratchet."
  },
  {
    slug: "ratchet-5-80",
    name: "5-80",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.70",
    metaTier: "B",
    notes: "Tall height, 5-sided ratchet."
  },
  {
    slug: "ratchet-9-80",
    name: "9-80",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.85",
    metaTier: "B",
    notes: "Tall height, 9-sided burst resistant ratchet."
  },
  {
    slug: "ratchet-1-50",
    name: "1-50",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "5.80",
    metaTier: "A",
    notes: "Ultra low profile ratchet. Promotes low-height smash attacks."
  },

  // ── Extra competitive bits ──────────────────────────────────────────────────
  {
    slug: "bit-needle",
    name: "Needle",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.00",
    metaTier: "B",
    notes: "Classic defensive bit with a sharp tip. Moderate stamina, high stadium center control."
  },
  {
    slug: "bit-high-flat",
    name: "High Flat",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.30",
    metaTier: "B",
    notes: "Tall attack bit. Increases height for downward smash attacks."
  },
  {
    slug: "bit-high-taper",
    name: "High Taper",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.28",
    metaTier: "B",
    notes: "Tall balance bit. Slightly raised height version of Taper."
  },
  {
    slug: "bit-high-needle",
    name: "High Needle",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.10",
    metaTier: "B",
    notes: "Tall defense bit. Elevated sharp tip."
  },
  {
    slug: "bit-gear-flat",
    name: "Gear Flat",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.45",
    metaTier: "A",
    notes: "Attack bit with gear teeth all the way. Drives intense X-Dashes."
  },
  {
    slug: "bit-gear-ball",
    name: "Gear Ball",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.30",
    metaTier: "A",
    notes: "Stamina bit with gear teeth. Allows fast stamina recovery."
  },
  {
    slug: "bit-gear-needle",
    name: "Gear Needle",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.20",
    metaTier: "B",
    notes: "Defense bit with gear teeth. Moderate mobility."
  },
  {
    slug: "bit-metal-needle",
    name: "Metal Needle",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.90",
    metaTier: "B",
    notes: "Defensive bit with a solid metal tip. Highly resistant to stadium exits."
  },
  {
    slug: "bit-disc-ball",
    name: "Disc Ball",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.60",
    metaTier: "A",
    notes: "Stamina bit with a wide disk shield. Excellent Life After Death (LAD)."
  },
  {
    slug: "bit-glide",
    name: "Glide",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.30",
    metaTier: "B",
    notes: "Stamina bit with a free-spinning component. Good for spin equalization."
  },
  {
    slug: "bit-wide-ball",
    name: "Wide Ball",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.25",
    metaTier: "A",
    notes: "Stamina bit with a wider sphere. Great stability."
  },
  {
    slug: "bit-rubber-flat",
    name: "Rubber Flat",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.15",
    metaTier: "A",
    notes: "Attack bit with rubber tip. Extreme speed but drains stamina rapidly."
  },
  {
    slug: "bit-extreme",
    name: "Extreme",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.35",
    metaTier: "S",
    notes: "Premier aggressive attack bit. Highest speed X-Dashes."
  }
];
