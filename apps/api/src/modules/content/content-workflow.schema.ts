import { z } from "zod";

export const transitionContentSchema = z.object({
  to: z.enum([
    "DRAFT",
    "READY_FOR_REVIEW",
    "CHANGES_REQUESTED",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "ARCHIVED",
  ]),
  reason: z.string().trim().min(1).max(1_000).optional(),
  reviewerId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
});

export const scheduleContentSchema = z.object({
  scheduledAt: z.coerce.date(),
  timezone: z.string().trim().min(1).max(100).default("Europe/Paris"),
});

export const assignContentSchema = z
  .object({
    assigneeId: z.string().uuid().nullable().optional(),
    reviewerId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (value) => value.assigneeId !== undefined || value.reviewerId !== undefined,
    "Une assignation est requise.",
  );

export const calendarDateSchema = scheduleContentSchema.extend({ scheduledAt: z.coerce.date().nullable() });
