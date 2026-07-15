import { z } from "zod";

const fields = {
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5_000).nullable().optional(),
  objective: z.string().trim().max(500).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#8B5CF6"),
};

export const createCampaignSchema = z
  .object(fields)
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: "La date de fin doit suivre la date de début.",
  });
export const updateCampaignSchema = z
  .object(fields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Au moins un champ est requis.")
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: "La date de fin doit suivre la date de début.",
  });
export const listCampaignSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  q: z.string().trim().max(160).optional(),
});
