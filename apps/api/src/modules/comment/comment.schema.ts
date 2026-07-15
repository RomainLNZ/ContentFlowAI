import { z } from "zod";

export const commentBodySchema = z.object({
  body: z.string().trim().min(1).max(5_000),
  mentionedUserIds: z.array(z.string().uuid()).max(20).default([]),
});
export const updateCommentSchema = z.object({ body: z.string().trim().min(1).max(5_000) });
