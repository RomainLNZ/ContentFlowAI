import { z } from "zod";

const arrayParam = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.split(",").filter(Boolean) : value),
    z.array(schema),
  );

export const calendarQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    view: z.enum(["month", "week", "list"]).default("month"),
    status: arrayParam(
      z.enum([
        "DRAFT",
        "READY_FOR_REVIEW",
        "CHANGES_REQUESTED",
        "APPROVED",
        "SCHEDULED",
        "PUBLISHED",
        "ARCHIVED",
      ]),
    ).optional(),
    platform: arrayParam(z.enum(["LINKEDIN"])).optional(),
    authorId: z.string().uuid().optional(),
    assigneeId: z.string().uuid().optional(),
    campaignId: z.string().uuid().optional(),
    q: z.string().trim().max(200).optional(),
    includeUnscheduled: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .default(false),
  })
  .superRefine((value, context) => {
    if (value.to <= value.from) context.addIssue({ code: "custom", message: "Période invalide." });
    if (value.to.getTime() - value.from.getTime() > 93 * 86_400_000)
      context.addIssue({ code: "custom", message: "La période ne peut pas dépasser 93 jours." });
  });
