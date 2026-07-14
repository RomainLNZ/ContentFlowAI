import { z } from "zod";

export const linkedInGenerationRequestSchema = z.object({
  brief: z.string().trim().min(10).max(8_000),
  objective: z.string().trim().min(3).max(500),
  audience: z.string().trim().min(2).max(500),
  tone: z.string().trim().min(2).max(240).default("Clair, humain et expert"),
});

export type LinkedInGenerationRequest = z.infer<typeof linkedInGenerationRequestSchema>;
