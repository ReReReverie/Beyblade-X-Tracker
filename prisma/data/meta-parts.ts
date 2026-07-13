import { Manufacturer, PartRole, PartSeries, PartType, RatchetIntegration } from "@prisma/client";

export type MetaPartSeed = {
  slug: string;
  name: string;
  type: PartType;
  role?: PartRole;
  manufacturer: Manufacturer;
  series?: PartSeries | null;
  ratchetIntegration?: RatchetIntegration;
  weightGrams?: string;
  metaTier?: "S" | "A" | "B";
  notes?: string;
};

const uxBladeNames = new Set([
  "Aero Pegasus",
  "Clock Mirage",
  "Dran Buster",
  "Ghost Circle",
  "Golem Rock",
  "Hack Viking",
  "Hells Hammer",
  "Wyvern Hover",
  "Impact Drake",
  "Knight Mail",
  "Leon Crest",
  "Meteor Dragoon",
  "Mummy Curse",
  "Orochi Cluster",
  "Phoenix Rudder",
  "Samurai Saber",
  "Scorpio Spear",
  "Shark Scale",
  "Shinobi Shadow",
  "Silver Wolf",
  "Stun Medusa",
  "Whale Wave",
  "Wizard Rod"
]);

const cxBladeNames = new Set(["Emperor Blast Heavy"]);

const cxExpandedBladeNames = new Set<string>([]);

const uxExpandedBladeNames = new Set([
  "Bullet Griffon",
  "Cutter Shinobi",
  "Glory Valk",
  "Hells Nether",
  "Rampart Aegis",
  "Rocket Griffon",
  "Seize Jaguar",
  "Valor Bison"
]);

const bxExpandedBladeNames = new Set(["Cyclops Eye", "Dran Strike", "Heavens Ring", "Sieg Superion"]);

export function applyMetaPartMetadata(part: MetaPartSeed): MetaPartSeed {
  if (part.type !== "BLADE") {
    return {
      ...part,
      series: null,
      ratchetIntegration: part.ratchetIntegration ?? RatchetIntegration.NONE,
      role: part.role ?? part.type
    };
  }

  return {
    ...part,
    series:
      part.series ??
      (uxExpandedBladeNames.has(part.name)
        ? PartSeries.UX_EXPANDED
        : bxExpandedBladeNames.has(part.name)
          ? PartSeries.BX_EXPANDED
          : cxExpandedBladeNames.has(part.name)
            ? PartSeries.CX_EXPANDED
            : cxBladeNames.has(part.name)
              ? PartSeries.CX
              : uxBladeNames.has(part.name)
                ? PartSeries.UX
                : PartSeries.BX),
    ratchetIntegration: part.ratchetIntegration ?? RatchetIntegration.NONE,
    role: part.role ?? PartRole.BLADE
  };
}

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
    slug: "wyvern-hover",
    name: "Wyvern Hover",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "34.50",
    metaTier: "S",
    notes: "UX attack blade with strong Over/Xtreme Zone reversal. Pairs with 1-60/1-70 Rush. Hasbro equivalent: Hover Wyvern."
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
    manufacturer: "TAKARA_TOMY",
    weightGrams: "32.77",
    metaTier: "B",
    notes: "Light defensive blade. Budget-friendly option for 4-60 Point builds."
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
    notes: "Simple Type Ratchet (RBT-Ratchet) - O-type joint. 4 protrusions at 5.5mm height. Compatible with Clock Mirage. Simple-type ratchet for Clock Mirage stamina builds. Pairs with Under Needle."
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
    notes: "70-height ratchet for Shark Scale Low Rush and Wyvern Hover attack variants."
  },
  {
    slug: "ratchet-4-60",
    name: "4-60",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "6.12",
    metaTier: "B",
    notes: "Common ratchet. Used in budget defense and balance builds."
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
    manufacturer: "TAKARA_TOMY",
    weightGrams: "2.17",
    metaTier: "B",
    notes: "Balanced movement bit. Common in defense builds."
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
    slug: "whale-wave",
    name: "Whale Wave",
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

  // ── Simple Type Ratchets (RBT-Ratchet, O-type joint, Clock Mirage compatible) ──
  {
    slug: "ratchet-9-65",
    name: "9-65",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    notes: "Simple Type Ratchet (RBT-Ratchet) - O-type joint. 9 protrusions at 6.5mm height. Compatible with Clock Mirage."
  },
  {
    slug: "ratchet-7-55",
    name: "7-55",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    notes: "Simple Type Ratchet (RBT-Ratchet) - O-type joint. 7 protrusions at 5.5mm height. Compatible with Clock Mirage."
  },
  {
    slug: "ratchet-3-85",
    name: "3-85",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    notes: "Simple Type Ratchet (RBT-Ratchet) - O-type joint. 3 protrusions at 8.5mm height. Compatible with Clock Mirage."
  },
  {
    slug: "ratchet-m-85",
    name: "M-85",
    type: "RATCHET",
    manufacturer: "TAKARA_TOMY",
    weightGrams: "10.60",
    notes: "Simple Type Ratchet (RBT-Ratchet) - O-type joint. Heaviest ratchet at 10.6g. Compatible with Clock Mirage."
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
  },
  {
    slug: "bullet-griffon",
    name: "Bullet Griffon",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    weightGrams: "63.20",
    notes: "UX-19 ratchet-integrated blade. Splits into Bullet (attack) and Griffon (defense) halves mid-battle."
  },
  {
    slug: "rocket-griffon",
    name: "Rocket Griffon",
    type: "BLADE",
    manufacturer: "HASBRO",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "Hasbro-equivalent ratchet-integrated blade. Same mold as Bullet Griffon."
  },
  {
    slug: "glory-valk",
    name: "Glory Valk",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "UX-20 ratchet-integrated blade. High-stamina attacker with wide contact points. Takara Tomy only, no Hasbro version currently."
  },
  {
    slug: "hells-nether",
    name: "Hells Nether",
    type: "BLADE",
    manufacturer: "TAKARA_TOMY",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "UX ratchet-integrated blade. Heavy attack platform with integrated ratchet."
  },
  {
    slug: "cutter-shinobi",
    name: "Cutter Shinobi",
    type: "BLADE",
    manufacturer: "HASBRO",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "Hasbro-exclusive ratchet-integrated blade."
  },
  {
    slug: "rampart-aegis",
    name: "Rampart Aegis",
    type: "BLADE",
    manufacturer: "HASBRO",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "Hasbro-exclusive ratchet-integrated blade."
  },
  {
    slug: "seize-jaguar",
    name: "Seize Jaguar",
    type: "BLADE",
    manufacturer: "HASBRO",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "Hasbro-exclusive ratchet-integrated blade."
  },
  {
    slug: "valor-bison",
    name: "Valor Bison",
    type: "BLADE",
    manufacturer: "HASBRO",
    series: PartSeries.UX_EXPANDED,
    ratchetIntegration: RatchetIntegration.BLADE,
    notes: "Hasbro-exclusive ratchet-integrated blade."
  },
  {
    slug: "turbo",
    name: "Turbo",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    ratchetIntegration: RatchetIntegration.BIT,
    notes: "Ratchet-integrated bit."
  },
  {
    slug: "operate",
    name: "Operate",
    type: "BIT",
    manufacturer: "TAKARA_TOMY",
    ratchetIntegration: RatchetIntegration.BIT,
    notes: "Ratchet-integrated bit."
  }
];

const formatWikiName = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugifyWikiName = (value: string, prefix = "") => {
  const normalized = formatWikiName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${prefix}${normalized}`;
};

const wikiBladeNames = [
  // Basic Line (Takara Tomy)
  "BlackShell",
  "CobaltDragoon",
  "CobaltDrake",
  "CrimsonGaruda",
  "DranDagger",
  "DranSword",
  "HellsChain",
  "HellsScythe",
  "KnightLance",
  "KnightShield",
  "LeonClaw",
  "PhoenixFeather",
  "PhoenixWing",
  "RhinoHorn",
  "SamuraiCalibur",
  "SharkEdge",
  "ShelterDrake",
  "SphinxCowl",
  "TriceraPress",
  "TyrannoBeat",
  "UnicornSting",
  "ViperTail",
  "WeissTiger",
  "WhaleWave",
  "WizardArrow",
  "WyvernGale",
  // Hasbro-debut blades with TT names (Basic Line)
  "BatGust",
  "BearScratch",
  "CrocCrunch",
  "GoatTackle",
  "MammothTusk",
  "PteraSwing",
  "SamuraiSteel",
  "SharkGill",
  "ShinobiKnife",
  "TriceraSpiky",
  "TyrannoRoar",
  // Unique Line (UX)
  "AeroPegasus",
  "ClockMirage",
  "DranBuster",
  "GhostCircle",
  "GolemRock",
  "HellsHammer",
  "ImpactDrake",
  "KnightMail",
  "LeonCrest",
  "MeteorDragoon",
  "MummyCurse",
  "OrochiCluster",
  "PhoenixRudder",
  "SamuraiSaber",
  "ScorpioSpear",
  "SharkScale",
  "ShinobiShadow",
  "SilverWolf",
  "WizardRod",
  "WyvernHover",
  // Unique Line ratchet-integrated (UX_EXPANDED - TT)
  "HellsNether",
  // BX_EXPANDED (Expand Blades)
  "CyclopsEye",
  "DranStrike",
  "HeavensRing",
  "SiegSuperion",
  // X-Over Project
  "DragoonStorm",
  "DranzerSpiral",
  "DrigerSlash",
  "DracielShield",
  "StormPegasis",
  "StormSpriggan",
  "Trypio",
  "VictoryValkyrie",
  "XenoXcalibur",
  // X-Over Project (pre-formatted names)
  "Lightning L-Drago (Rapid-Hit Type)",
  "Lightning L-Drago (Upper Type)",
  "Rock Leone"
];

const wikiHasbroOnlyBladeNames = [
  // Basic Line Hasbro exclusives (N/A for TT)
  "Clamp Crab",
  "Yell Kong",
  // Unique Line Hasbro exclusives (N/A for TT)
  "Hack Viking",
  "Stun Medusa"
];

/**
 * Hasbro equivalents of TT blades that share the same mold but have different names.
 * Key: TT PascalCase name, Value: Hasbro display name.
 * BulletGriffon is omitted because "Rocket Griffon" already exists in metaParts.
 */
const wikiHasbroEquivalentBladeNames: Record<string, string> = {
  DranSword: "Sword Dran",
  KnightShield: "Helm Knight",
  WizardArrow: "Arrow Wizard",
  HellsScythe: "Scythe Incendio",
  KnightLance: "Lance Knight",
  LeonClaw: "Claw Leon",
  DranBuster: "Buster Dran",
  WizardRod: "Wand Wizard",
  ShinobiShadow: "Shadow Shinobi",
  CrimsonGaruda: "Scarlet Garuda",
  SilverWolf: "Sterling Wolf",
  GolemRock: "Rock Golem",
  PhoenixWing: "Soar Phoenix",
  SharkScale: "Scale Shark",
  PhoenixRudder: "Rudder Phoenix",
  PhoenixFeather: "Feather Phoenix",
  SamuraiCalibur: "Steel Samurai",
  RhinoHorn: "Horn Rhino",
  SharkEdge: "Keel Shark",
  UnicornSting: "Sting Unicorn",
  TyrannoBeat: "Roar Tyranno",
  SphinxCowl: "Cowl Sphinx",
  BlackShell: "Obsidian Shell",
  DranDagger: "Dagger Dran",
  WhaleWave: "Tide Whale",
  ViperTail: "Tail Viper",
  HellsChain: "Chain Incendio",
  HellsHammer: "Hammer Incendio",
  WyvernGale: "Gale Wyvern",
  ShinobiKnife: "Knife Shinobi",
  WeissTiger: "Pearl Tiger",
  LeonCrest: "Crest Leon",
  GhostCircle: "Circle Ghost",
  ScorpioSpear: "Spear Scorpio",
  MummyCurse: "Curse Mummy",
  MeteorDragoon: "Meteoroid Dragoon",
  TriceraPress: "Ridge Triceratops",
  DranStrike: "Strike Dran",
  SiegSuperion: "Suppress Superion",
  GloryValkyrie: "Glory Valkerion",
  KnightMail: "Mail Knight",
  BatGust: "Gust Bat",
  SamuraiSaber: "Saber Samurai",
  SharkGill: "Gill Shark",
  GoatTackle: "Tackle Goat",
  BearScratch: "Savage Bear",
  CrocCrunch: "Bite Croc",
  WyvernHover: "Hover Wyvern"
};

// CX-exclusive ratchets (0-60, 1-50, 4-55, 5-50, 6-60, 6-80, 8-70) are intentionally
// omitted from this array because they are covered by `cxRatchetNames`.
// Simple-type ratchets (9-65, 7-55, 3-85, M-85) are intentionally omitted from this
// array because they have explicit entries in `metaParts` with detailed annotations.
const wikiRatchetNames = [
  // Unique Line ratchets
  "0-70",
  "0-80",
  "1-60",
  "1-80",
  "2-70",
  "3-70",
  "4-50",
  "5-70",
  "7-60",
  "7-70",
  "9-70",
  // Basic Line ratchets
  "1-70",
  "2-60",
  "2-80",
  "3-60",
  "3-80",
  "4-60",
  "4-70",
  "4-80",
  "5-60",
  "5-80",
  "6-70",
  "7-80",
  "9-60",
  "9-80",
];

const wikiBitNames = [
  "Accel",
  "Bound Spike",
  "Disk Ball",
  "Free Ball",
  "Glide",
  "Hexa",
  "Jolt",
  "Level",
  "Low Rush",
  "Metal Needle",
  "Rubber Accel",
  "Under Flat",
  "Under Needle",
  "Zap",
  "Ball",
  "Cyclone",
  "Disk Spike",
  "Dot",
  "Elevate",
  "Flat",
  "Free Flat",
  "Gear Ball",
  "Gear Flat",
  "Gear Needle",
  "Gear Point",
  "High Needle",
  "High Taper",
  "Low Flat",
  "Low Point",
  "Merge",
  "Needle",
  "Orb",
  "Point",
  "Quake",
  "Rush",
  "Spike",
  "Taper",
  "Trans Point",
  "Unite",
  "Gear Rush",
  "Gear Unite",
  "Ignition",
  "Kick",
  "Low Orb",
  "Narrow",
  "Trans Kick",
  "Vortex",
  "Wall Ball",
  "Wall Wedge",
  "Wedge",
  "Yielding"
];

const cxLockChipNames = [
  "Bahamut", "Brachio", "Bucks", "Cerberus", "Croc", "Drake", "Dran", "Enlil", "Eva", "Fox", "Hells", "Hornet", "Knight", "Kraken", "Leon", "Emperor", "Pegasus", "Perseus", "Phoenix", "Ragna", "Rhino", "Sol", "Tiga", "Unicorn", "Valkerion", "Valkyrie", "Whale", "Wolf", "Wizard"
];

const cxMainBladeNames = [
  "Antler", "Antlers", "Arc", "Blast", "Brave", "Courage", "Brush", "Dark", "Eclipse", "Umbra", "Fang", "Flame", "Flare", "Fort", "Hunt", "Might", "Reaper", "Volt", "Wriggle"
];

const cxMetalBladeNames = ["Blitz", "Delta", "Fortress", "Armor", "Hurricane", "Rage", "Tread", "Whip"];
const cxOverBladeNames = ["Break", "Flow", "Guard", "I", "Outer", "Peak", "T"];

const cxAssistBladeNames = [
  "Assault", "Bumper", "Charge", "Dual", "Erase", "Free", "Gravity", "Heavy", "Jaggy", "Knuckle", "Massive", "Odd", "Q", "Round", "Slash", "Turn", "Vertical", "Wheel", "Zillion"
];

const cxRatchetNames = ["0-60", "1-50", "4-55", "5-50", "6-60", "6-80", "8-70"];
const cxBitNames = ["Gear Rush", "Gear Unite", "Ignition", "Kick", "Low Orb", "Narrow", "Trans Kick", "Vortex", "Wall Ball", "Wall Wedge", "Wedge", "Yielding"];

const cxGeneratedParts: MetaPartSeed[] = [
  ...cxLockChipNames.map((name) => ({ slug: slugifyWikiName(name, "cx-lock-chip-"), name, type: "BLADE" as PartType, role: PartRole.LOCK_CHIP, series: PartSeries.CX, manufacturer: "TAKARA_TOMY" as Manufacturer })),
  ...cxMainBladeNames.map((name) => ({ slug: slugifyWikiName(name, "cx-main-blade-"), name, type: "BLADE" as PartType, role: PartRole.MAIN_BLADE, series: PartSeries.CX, manufacturer: "TAKARA_TOMY" as Manufacturer })),
  ...cxAssistBladeNames.map((name) => ({ slug: slugifyWikiName(name, "cx-assist-blade-"), name, type: "BLADE" as PartType, role: PartRole.ASSIST_BLADE, series: PartSeries.CX, manufacturer: "TAKARA_TOMY" as Manufacturer })),
  ...cxOverBladeNames.map((name) => ({ slug: slugifyWikiName(name, "cx-over-blade-"), name, type: "BLADE" as PartType, role: PartRole.OVER_BLADE, series: PartSeries.CX_EXPANDED, manufacturer: "TAKARA_TOMY" as Manufacturer })),
  ...cxMetalBladeNames.map((name) => ({ slug: slugifyWikiName(name, "cx-metal-blade-"), name, type: "BLADE" as PartType, role: PartRole.METAL_BLADE, series: PartSeries.CX_EXPANDED, manufacturer: "TAKARA_TOMY" as Manufacturer })),
  ...cxRatchetNames.map((name) => ({ slug: slugifyWikiName(name, "ratchet-"), name, type: "RATCHET" as PartType, role: PartRole.RATCHET, manufacturer: "TAKARA_TOMY" as Manufacturer })),
  ...cxBitNames.map((name) => ({ slug: slugifyWikiName(name, "bit-"), name, type: "BIT" as PartType, role: PartRole.BIT, manufacturer: "TAKARA_TOMY" as Manufacturer }))
].map(applyMetaPartMetadata);
const wikiGeneratedParts: MetaPartSeed[] = [
  ...wikiBladeNames.map((name) => ({
    slug: slugifyWikiName(name),
    name: formatWikiName(name),
    type: "BLADE" as PartType,
    manufacturer: "TAKARA_TOMY" as Manufacturer
  })),
  ...wikiHasbroOnlyBladeNames.map((name) => ({
    slug: slugifyWikiName(name),
    name: formatWikiName(name),
    type: "BLADE" as PartType,
    manufacturer: "HASBRO" as Manufacturer
  })),
  ...Object.entries(wikiHasbroEquivalentBladeNames).map(([, hasbroName]) => ({
    slug: slugifyWikiName(hasbroName),
    name: hasbroName,
    type: "BLADE" as PartType,
    manufacturer: "HASBRO" as Manufacturer
  })),
  ...wikiRatchetNames.map((name) => ({
    slug: slugifyWikiName(name, "ratchet-"),
    name: formatWikiName(name),
    type: "RATCHET" as PartType,
    manufacturer: "TAKARA_TOMY" as Manufacturer
  })),
  ...wikiBitNames.map((name) => ({
    slug: slugifyWikiName(name, "bit-"),
    name: formatWikiName(name),
    type: "BIT" as PartType,
    manufacturer: "TAKARA_TOMY" as Manufacturer
  }))
].map(applyMetaPartMetadata);

const partKey = (part: MetaPartSeed) => `${part.type}:${part.slug}`;

export const allMetaParts: MetaPartSeed[] = [...metaParts.map(applyMetaPartMetadata), ...cxGeneratedParts, ...wikiGeneratedParts].filter(
  (part, index, parts) => parts.findIndex((candidate) => partKey(candidate) === partKey(part)) === index
);

