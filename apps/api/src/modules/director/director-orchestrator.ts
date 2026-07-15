import { AiCoreError, type AiProvider } from "@flowpilot/ai";
import { z } from "zod";
import type { WorkspaceIntelligenceSnapshot } from "../workspace-intelligence/workspace-intelligence.types.js";
import {
  directorOutputSchema,
  type DirectorRecommendationOutput,
  type DirectorResult,
} from "./director.schema.js";

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

function keyPart(value: string | null): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "none"
  );
}

function recommendationKey(recommendation: Omit<DirectorRecommendationOutput, "deduplicationKey">): string {
  return [
    recommendation.type,
    keyPart(recommendation.campaignId),
    keyPart(recommendation.contentId),
    keyPart(recommendation.objectiveType),
    keyPart(recommendation.title),
  ].join(":");
}

export class DirectorOrchestrator {
  constructor(
    private readonly provider: AiProvider,
    private readonly model: string,
  ) {}

  async execute(snapshot: WorkspaceIntelligenceSnapshot, signal?: AbortSignal): Promise<DirectorResult> {
    const response = await this.provider.generate(
      {
        messages: [
          {
            role: "system",
            content:
              "Tu es le Directeur Communication de FlowPilot. Analyse uniquement le snapshot fourni. N’invente aucun fait, ne crée aucun contenu et retourne uniquement des recommandations actionnables structurées.",
          },
          { role: "user", content: JSON.stringify(snapshot) },
        ],
        settings: { model: this.model, maxOutputTokens: 6_000, responseFormat: "json" },
        structuredOutput: {
          name: "director_recommendations",
          description: "Recommandations structurées fondées exclusivement sur Workspace Intelligence.",
          schema: z.toJSONSchema(directorOutputSchema) as Readonly<Record<string, unknown>>,
        },
      },
      signal,
    );

    let json: unknown;
    try {
      json = JSON.parse(response.content);
    } catch (error) {
      throw new AiCoreError(
        "INVALID_STRUCTURED_OUTPUT",
        "Le Director n’a pas retourné un JSON valide.",
        error,
      );
    }
    const parsed = directorOutputSchema.safeParse(json);
    if (!parsed.success) {
      throw new AiCoreError(
        "INVALID_STRUCTURED_OUTPUT",
        "Les recommandations du Director ne respectent pas le contrat attendu.",
        parsed.error,
      );
    }

    const campaignIds = new Set(snapshot.campaignCoverage.map(({ campaignId }) => campaignId));
    const contentIds = new Set(snapshot.blockedContents.map(({ contentId }) => contentId));
    const objectives = new Set(snapshot.objectiveCoverage.map(({ objective }) => objective));
    const forbiddenTerms = snapshot.brandContext.forbiddenWords.map((term) => term.toLocaleLowerCase("fr"));
    const unique = new Map<string, DirectorRecommendationOutput>();

    for (const recommendation of parsed.data.recommendations) {
      if (recommendation.campaignId && !campaignIds.has(recommendation.campaignId)) {
        throw new AiCoreError("GUARDRAIL_REJECTED", "Une recommandation référence une campagne inconnue.");
      }
      if (recommendation.contentId && !contentIds.has(recommendation.contentId)) {
        throw new AiCoreError("GUARDRAIL_REJECTED", "Une recommandation référence un contenu inconnu.");
      }
      if (recommendation.objectiveType && !objectives.has(recommendation.objectiveType)) {
        throw new AiCoreError("GUARDRAIL_REJECTED", "Une recommandation référence un objectif inconnu.");
      }
      const searchable =
        `${recommendation.title} ${recommendation.summary} ${recommendation.rationale}`.toLocaleLowerCase(
          "fr",
        );
      if (forbiddenTerms.some((term) => term && searchable.includes(term))) {
        throw new AiCoreError("GUARDRAIL_REJECTED", "Une recommandation contient un terme interdit.");
      }
      const deduplicationKey = recommendationKey(recommendation);
      if (!unique.has(deduplicationKey))
        unique.set(deduplicationKey, { ...recommendation, deduplicationKey });
    }

    const recommendations = [...unique.values()].sort(
      (left, right) =>
        PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
        left.deduplicationKey.localeCompare(right.deduplicationKey),
    );
    const priorities = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const recommendation of recommendations) priorities[recommendation.priority] += 1;

    return {
      provider: this.provider.descriptor.id,
      model: response.model,
      recommendations,
      priorities,
      risks: recommendations.filter(({ kind }) => kind === "RISK"),
      opportunities: recommendations.filter(({ kind }) => kind === "OPPORTUNITY"),
    };
  }
}
