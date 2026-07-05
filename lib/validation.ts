import { BattleFormat, FeaturedSlot, Manufacturer, PartType, Visibility } from "@prisma/client";
import { z } from "zod";

export const visibilitySchema = z.nativeEnum(Visibility).default("PUBLIC");

export const partSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.nativeEnum(PartType),
  manufacturer: z.nativeEnum(Manufacturer).default("UNKNOWN"),
  weightGrams: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive().max(999.99).optional()
  ),
  conditionRating: z.coerce.number().min(0).max(10),
  visibility: visibilitySchema,
  notes: z.string().trim().max(1000).optional()
});

export const updatePartSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  type: z.nativeEnum(PartType).optional(),
  manufacturer: z.nativeEnum(Manufacturer).optional(),
  weightGrams: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive().max(999.99).optional()
  ),
  conditionRating: z.coerce.number().min(0).max(10).optional(),
  visibility: visibilitySchema.optional(),
  notes: z.string().trim().max(1000).optional().nullable()
});

export const comboSchema = z.object({
  mode: z.enum(["BX_UX", "CX", "CX_EXPANDED"]).default("BX_UX"),
  bladeId: z.string().optional(),
  lockChipId: z.string().optional(),
  mainBladeId: z.string().optional(),
  assistBladeId: z.string().optional(),
  overBladeId: z.string().optional(),
  metalBladeId: z.string().optional(),
  ratchetId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.string().min(1).optional()
  ),
  bitId: z.string().min(1),
  visibility: visibilitySchema,
  notes: z.string().trim().max(1000).optional()
});

const optionalRpmSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().positive().max(99999).optional()
);

export const battleSchema = z.object({
  format: z.nativeEnum(BattleFormat).default("ONE_V_ONE"),
  comboAId: z.string().optional(),
  comboBId: z.string().optional(),
  winnerId: z.string().optional(),
  comboARpm: optionalRpmSchema,
  comboBRpm: optionalRpmSchema,
  deckAId: z.string().optional(),
  deckBId: z.string().optional(),
  deckWinnerId: z.string().optional(),
  visibility: visibilitySchema,
  notes: z.string().trim().max(1000).optional()
});

export const deckSchema = z.object({
  name: z.string().trim().min(1).max(80),
  comboOneId: z.string().min(1),
  comboTwoId: z.string().min(1),
  comboThreeId: z.string().min(1),
  visibility: visibilitySchema,
  notes: z.string().trim().max(1000).optional()
});

export const comboCommentSchema = z.object({
  comboId: z.string().min(1),
  body: z.string().trim().min(1).max(1000)
});

export const comboActionSchema = z.object({
  comboId: z.string().min(1)
});

export const catalogImportSchema = z.object({
  catalogIds: z.array(z.string().min(1)).min(1).max(50)
});

export const featuredComboSchema = z.object({
  comboId: z.string().min(1),
  slot: z.nativeEnum(FeaturedSlot),
  title: z.string().trim().min(1).max(100),
  sponsorName: z.string().trim().max(100).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date()
}).refine((data) => data.endsAt > data.startsAt, {
  message: "End time must be after start time.",
  path: ["endsAt"]
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().max(80).optional(),
  image: z.string().trim().url().max(500).optional().or(z.literal("")),
  bio: z.string().trim().max(280).optional()
});

export const careerEntrySchema = z.object({
  tournamentName: z.string().trim().min(1).max(120),
  placement: z.string().trim().max(60).optional(),
  wins: z.coerce.number().int().min(0).max(999).default(0),
  losses: z.coerce.number().int().min(0).max(999).default(0),
  draws: z.coerce.number().int().min(0).max(999).default(0),
  playedAt: z.coerce.date(),
  notes: z.string().trim().max(1000).optional()
});


