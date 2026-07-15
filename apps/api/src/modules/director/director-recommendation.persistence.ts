import { Prisma, type PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import type { DirectorRecommendationOutput } from "./director.schema.js";

type Tenant = { organizationId: string; workspaceId: string };

export class DirectorRecommendationPersistenceService {
  constructor(private readonly prisma: PrismaClient) {}

  persist(tenant: Tenant, analysisId: string, recommendations: readonly DirectorRecommendationOutput[]) {
    return this.prisma.$transaction(async (transaction) => {
      const analysis = await transaction.directorAnalysis.findFirst({
        where: { id: analysisId, ...tenant },
        select: { id: true },
      });
      if (!analysis) throw new HttpError(404, "DIRECTOR_ANALYSIS_NOT_FOUND", "Analyse Director introuvable.");

      return Promise.all(
        recommendations.map((recommendation) => {
          const data = {
            analysisId,
            type: recommendation.type,
            priority: recommendation.priority,
            confidence: new Prisma.Decimal(recommendation.confidence),
            title: recommendation.title,
            summary: recommendation.summary,
            rationale: recommendation.rationale,
            evidence: { ...recommendation.evidence, kind: recommendation.kind },
            suggestedAction: recommendation.suggestedAction,
            campaignId: recommendation.campaignId,
            contentId: recommendation.contentId,
            objectiveType: recommendation.objectiveType,
            suggestedAt: recommendation.suggestedAt ? new Date(recommendation.suggestedAt) : null,
            expiresAt: recommendation.expiresAt ? new Date(recommendation.expiresAt) : null,
          };
          return transaction.directorRecommendation.upsert({
            where: {
              organizationId_workspaceId_deduplicationKey: {
                ...tenant,
                deduplicationKey: recommendation.deduplicationKey,
              },
            },
            create: { ...tenant, ...data, deduplicationKey: recommendation.deduplicationKey },
            update: data,
          });
        }),
      );
    });
  }
}
