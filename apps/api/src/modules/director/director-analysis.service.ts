import { Prisma, type PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import type { FeatureFlagService } from "../feature-flags/feature-flag.service.js";
import type { WorkspaceIntelligenceService } from "../workspace-intelligence/workspace-intelligence.service.js";
import type { DirectorOrchestrator } from "./director-orchestrator.js";
import type { DirectorRecommendationPersistenceService } from "./director-recommendation.persistence.js";

type Tenant = { organizationId: string; workspaceId: string };
type Clock = { now(): Date };

export class DirectorAnalysisService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly featureFlags: Pick<FeatureFlagService, "evaluate">,
    private readonly intelligence: Pick<WorkspaceIntelligenceService, "buildSnapshot">,
    private readonly director: Pick<DirectorOrchestrator, "execute">,
    private readonly persistence: Pick<DirectorRecommendationPersistenceService, "persist">,
    private readonly providerId: string,
    private readonly model: string,
    private readonly clock: Clock = { now: () => new Date() },
  ) {}

  async runManual(tenant: Tenant, actorId: string) {
    const decision = await this.featureFlags.evaluate(
      tenant.organizationId,
      "communication_director",
      this.clock.now(),
    );
    if (!decision.enabled)
      throw new HttpError(403, "DIRECTOR_DISABLED", "Le Communication Director n’est pas activé.");

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: tenant.workspaceId, organizationId: tenant.organizationId, archivedAt: null },
      select: { id: true },
    });
    if (!workspace) throw new HttpError(404, "WORKSPACE_NOT_FOUND", "Workspace introuvable.");

    const existing = await this.prisma.directorAnalysis.findFirst({
      where: { ...tenant, status: "RUNNING" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return { analysis: existing, reused: true };

    const startedAt = this.clock.now();
    let analysis;
    try {
      analysis = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.directorAnalysis.create({
          data: {
            ...tenant,
            triggeredById: actorId,
            triggerType: "MANUAL",
            provider: this.providerId,
            model: this.model,
            status: "RUNNING",
            periodStart: new Date(startedAt.getTime() - 30 * 86_400_000),
            periodEnd: new Date(startedAt.getTime() + 30 * 86_400_000),
            startedAt,
          },
        });
        await transaction.auditLog.create({
          data: {
            ...tenant,
            actorId,
            action: "director.analysis_started",
            entityType: "director_analysis",
            entityId: created.id,
            metadata: { triggerType: "MANUAL" },
          },
        });
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const running = await this.prisma.directorAnalysis.findFirstOrThrow({
          where: { ...tenant, status: "RUNNING" },
          orderBy: { createdAt: "desc" },
        });
        return { analysis: running, reused: true };
      }
      throw error;
    }

    try {
      const snapshot = await this.intelligence.buildSnapshot(tenant);
      const result = await this.director.execute(snapshot);
      await this.persistence.persist(tenant, analysis.id, result.recommendations);
      const completedAt = this.clock.now();
      const completed = await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.directorAnalysis.update({
          where: { id: analysis.id },
          data: {
            status: "COMPLETED",
            provider: result.provider,
            model: result.model,
            completedAt,
            inputSummary: {
              contentCount: Object.values(snapshot.aggregates.workflow).reduce(
                (sum, count) => sum + count,
                0,
              ),
              campaignCount: snapshot.campaignCoverage.length,
              objectiveCount: snapshot.objectiveCoverage.length,
              brandCompleteness: snapshot.brandProfileCompleteness.score,
            },
            facts: {
              recommendationCount: result.recommendations.length,
              priorities: result.priorities,
              riskCount: result.risks.length,
              opportunityCount: result.opportunities.length,
              durationMs: completedAt.getTime() - startedAt.getTime(),
            },
          },
        });
        await transaction.notification.create({
          data: {
            ...tenant,
            recipientId: actorId,
            actorId: null,
            type: "DIRECTOR_ANALYSIS_COMPLETED",
            payload: { analysisId: analysis.id, recommendationCount: result.recommendations.length },
          },
        });
        const highPriority = result.recommendations.filter(
          ({ priority }) => priority === "HIGH" || priority === "CRITICAL",
        );
        if (highPriority.length) {
          const recipients = await transaction.workspaceMembership.findMany({
            where: {
              workspaceId: tenant.workspaceId,
              status: "ACTIVE",
              userId: { not: actorId },
              workspace: { organizationId: tenant.organizationId },
              role: { permissions: { some: { permission: { key: "director.read" } } } },
            },
            select: { userId: true },
            take: 50,
          });
          if (recipients.length)
            await transaction.notification.createMany({
              data: recipients.map(({ userId }) => ({
                ...tenant,
                recipientId: userId,
                actorId,
                type: "DIRECTOR_HIGH_PRIORITY_RECOMMENDATION" as const,
                payload: { analysisId: analysis.id, count: highPriority.length },
              })),
            });
        }
        return updated;
      });
      return { analysis: completed, reused: false, result };
    } catch (error) {
      const completedAt = this.clock.now();
      await this.prisma.directorAnalysis.updateMany({
        where: { id: analysis.id, ...tenant, status: "RUNNING" },
        data: {
          status: "FAILED",
          completedAt,
          errorCode:
            error instanceof Error && "code" in error ? String(error.code) : "DIRECTOR_EXECUTION_FAILED",
          errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : "Erreur inconnue",
        },
      });
      throw error;
    }
  }
}
