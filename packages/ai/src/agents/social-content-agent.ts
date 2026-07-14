import { z } from "zod";
import type { Agent } from "./index";

export const linkedInVariantSchema = z.object({
  style: z.enum(["DIRECT_CONCISE", "EXPERT_EDUCATIONAL", "HUMAN_ENGAGING"]),
  angle: z.string().min(1),
  hook: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string().min(1)).max(8),
  rationale: z.string().min(1),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
});

export const linkedInGenerationSchema = z.object({
  variants: z.array(linkedInVariantSchema).length(3),
});

export type LinkedInGeneration = z.infer<typeof linkedInGenerationSchema>;

export class SocialContentAgent implements Agent {
  readonly definition;

  constructor(model: string) {
    this.definition = {
      key: "social-content-linkedin",
      name: "Social Content Agent — LinkedIn",
      description: "Produit trois variantes de publication LinkedIn alignées sur la marque.",
      prompt: { key: "social.linkedin", version: 1 },
      providerId: "openai",
      model: { model, maxOutputTokens: 3_000, responseFormat: "json" as const },
      tools: [],
    };
  }

  async canHandle(task: string): Promise<boolean> {
    return /linkedin|publication|post|contenu/i.test(task);
  }
}
