import { BattleFormat, Manufacturer, PartType, Visibility } from "@prisma/client";
import { z } from "zod";

export const visibilitySchema = z.nativeEnum(Visibility).default("PUBLIC");

export const partSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.nativeEnum(PartType),
  manufacturer: z.nativeEnum(Manufacturer).default("UNKNOWN"),
  weightGrams: z.coerce.number().positive().max(999.99),
  conditionRating: z.coerce.number().min(0).max(10),
  visibility: visibilitySchema,
  notes: z.string().trim().max(1000).optional()
});

export const comboSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bladeId: z.string().min(1),
  ratchetId: z.string().min(1),
  bitId: z.string().min(1),
  visibility: visibilitySchema,
  notes: z.string().trim().max(1000).optional()
});

export const battleSchema = z.object({
  format: z.nativeEnum(BattleFormat).default("ONE_V_ONE"),
  comboAId: z.string().optional(),
  comboBId: z.string().optional(),
  winnerId: z.string().optional(),
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
