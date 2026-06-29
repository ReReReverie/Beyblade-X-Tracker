import { Manufacturer, PartType, Visibility } from "@prisma/client";
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
  comboAId: z.string().min(1),
  comboBId: z.string().min(1),
  winnerId: z.string().min(1),
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
