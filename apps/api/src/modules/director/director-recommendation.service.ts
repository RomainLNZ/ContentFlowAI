import type {
  DirectorRecommendationPriority,
  DirectorRecommendationStatus,
  DirectorRecommendationType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import type { ContentCreationService } from "../content/content-creation.service.js";
import type { WorkspaceIntelligenceService } from "../workspace-intelligence/workspace-intelligence.service.js";

type Tenant = { organizationId: string; workspaceId: string };
type Clock = { now(): Date };

const recommendationSelect = {
  id: true,
  analysisId: true,
  type: true,
  status: true,
  priority: true,
  confidence: true,
  title: true,
  summary: true,
  rationale: true,
  evidence: true,
  suggestedAction: true,
  campaignId: true,
  contentId: true,
  objectiveType: true,
  suggestedAt: true,
  expiresAt: true,
  actedAt: true,
  dismissedAt: true,
  dismissalReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DirectorRecommendationSelect;

export class DirectorRecommendationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly intelligence: Pick<WorkspaceIntelligenceService, "buildSnapshot">,
    private readonly contentCreation: ContentCreationService,
    private readonly providerId: string,
    private readonly clock: Clock = { now: () => new Date() },
  ) {}

  async overview(tenant: Tenant) {
    const analysis = await this.prisma.directorAnalysis.findFirst({
      where: tenant,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        provider: true,
        model: true,
        createdAt: true,
        completedAt: true,
        errorCode: true,
        facts: true,
      },
    });
    const recommendations = await this.prisma.directorRecommendation.findMany({
      where: { ...tenant, status: { in: ["NEW", "VIEWED", "ACCEPTED"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: recommendationSelect,
    });
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
    recommendations.sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const priorities = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const item of recommendations) priorities[item.priority] += 1;
    const ageMs = analysis?.completedAt ? this.clock.now().getTime() - analysis.completedAt.getTime() : null;
    return {
      analysis,
      state: analysis?.status ?? "NOT_ANALYZED",
      provider: analysis?.provider ?? this.providerId,
      topRecommendations: recommendations.slice(0, 3),
      priorities,
      risks: recommendations.filter(({ type }) =>
        ["EDITORIAL_GAP", "CAMPAIGN_GAP", "CADENCE_WARNING", "WORKFLOW_BLOCKER"].includes(type),
      ),
      opportunities: recommendations.filter(({ type }) =>
        ["OBJECTIVE_IMBALANCE", "CONTENT_OPPORTUNITY", "CALENDAR_SUGGESTION"].includes(type),
      ),
      freshness:
        ageMs === null
          ? { state: "NONE", ageSeconds: null }
          : {
              state: ageMs <= 86_400_000 ? "FRESH" : ageMs <= 259_200_000 ? "STALE" : "EXPIRED",
              ageSeconds: Math.max(0, Math.floor(ageMs / 1_000)),
            },
    };
  }

  getAnalysis(tenant: Tenant, id: string) {
    return this.prisma.directorAnalysis.findFirst({
      where: { id, ...tenant },
      select: {
        id: true,
        triggerType: true,
        provider: true,
        model: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        inputSummary: true,
        facts: true,
        errorCode: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });
  }

  async list(
    tenant: Tenant,
    filters: {
      status?: DirectorRecommendationStatus | undefined;
      type?: DirectorRecommendationType | undefined;
      priority?: DirectorRecommendationPriority | undefined;
      campaignId?: string | undefined;
      contentId?: string | undefined;
      from?: Date | undefined;
      to?: Date | undefined;
      page: number;
      pageSize: number;
    },
  ) {
    const where = {
      ...tenant,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
      ...(filters.contentId ? { contentId: filters.contentId } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.directorRecommendation.findMany({
        where,
        select: recommendationSelect,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.directorRecommendation.count({ where }),
    ]);
    return { items, total, page: filters.page, pageSize: filters.pageSize };
  }

  async get(tenant: Tenant, id: string) {
    const item = await this.prisma.directorRecommendation.findFirst({
      where: { id, ...tenant },
      select: recommendationSelect,
    });
    if (!item) throw new HttpError(404, "DIRECTOR_RECOMMENDATION_NOT_FOUND", "Recommandation introuvable.");
    return item;
  }

  view(tenant: Tenant, actorId: string, id: string) {
    return this.transition(tenant, actorId, id, "VIEWED", ["NEW"], "director.recommendation_viewed");
  }

  accept(tenant: Tenant, actorId: string, id: string) {
    return this.transition(
      tenant,
      actorId,
      id,
      "ACCEPTED",
      ["NEW", "VIEWED"],
      "director.recommendation_accepted",
    );
  }

  dismiss(tenant: Tenant, actorId: string, id: string, reason: string, comment?: string) {
    return this.transition(
      tenant,
      actorId,
      id,
      "DISMISSED",
      ["NEW", "VIEWED"],
      "director.recommendation_dismissed",
      { dismissalReason: reason, dismissedAt: this.clock.now() },
      { reason, ...(comment ? { comment } : {}) },
    );
  }

  complete(tenant: Tenant, actorId: string, id: string) {
    return this.transition(
      tenant,
      actorId,
      id,
      "COMPLETED",
      ["ACCEPTED"],
      "director.recommendation_completed",
      { actedAt: this.clock.now() },
    );
  }

  async feedback(
    tenant: Tenant,
    actorId: string,
    id: string,
    input: { value: "HELPFUL" | "NOT_HELPFUL"; reason?: string | undefined; comment?: string | undefined },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const recommendation = await transaction.directorRecommendation.findFirst({
        where: { id, ...tenant },
        select: { id: true },
      });
      if (!recommendation)
        throw new HttpError(404, "DIRECTOR_RECOMMENDATION_NOT_FOUND", "Recommandation introuvable.");
      const feedback = await transaction.recommendationFeedback.upsert({
        where: { recommendationId_userId: { recommendationId: id, userId: actorId } },
        create: {
          ...tenant,
          recommendationId: id,
          userId: actorId,
          value: input.value,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
          ...(input.comment !== undefined ? { comment: input.comment } : {}),
        },
        update: {
          value: input.value,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
          ...(input.comment !== undefined ? { comment: input.comment } : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          ...tenant,
          actorId,
          action: "director.recommendation_feedback",
          entityType: "director_recommendation",
          entityId: id,
          metadata: { value: input.value, ...(input.reason ? { reason: input.reason } : {}) },
        },
      });
      return feedback;
    });
  }

  async prepareDraft(tenant: Tenant, id: string) {
    const recommendation = await this.get(tenant, id);
    const snapshot = await this.intelligence.buildSnapshot(tenant);
    const campaign = recommendation.campaignId
      ? snapshot.campaignCoverage.find(({ campaignId }) => campaignId === recommendation.campaignId)
      : null;
    return {
      subject: recommendation.title,
      angle: recommendation.rationale,
      objective: recommendation.objectiveType,
      audience: snapshot.brandContext.targetAudiences[0] ?? null,
      platform: "LINKEDIN" as const,
      campaign: campaign ? { id: campaign.campaignId, name: campaign.name } : null,
      suggestedAt: recommendation.suggestedAt,
      context: recommendation.summary,
      recommendationId: recommendation.id,
    };
  }

  async createDraft(
    tenant: Tenant,
    actorId: string,
    id: string,
    input: {
      title: string;
      body: string;
      cta?: string | null | undefined;
      hashtags: string[];
      tone?: string | undefined;
      targetAudience?: string | undefined;
    },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const recommendation = await transaction.directorRecommendation.findFirst({
        where: { id, ...tenant },
        select: {
          id: true,
          status: true,
          contentId: true,
          campaignId: true,
          objectiveType: true,
          suggestedAction: true,
          analysis: { select: { triggeredById: true } },
        },
      });
      if (!recommendation)
        throw new HttpError(404, "DIRECTOR_RECOMMENDATION_NOT_FOUND", "Recommandation introuvable.");
      if (recommendation.contentId) {
        const existing = await transaction.contentItem.findFirst({
          where: { id: recommendation.contentId, ...tenant },
          select: { id: true, title: true, status: true },
        });
        if (existing) return { content: existing, reused: true };
      }
      if (recommendation.campaignId) {
        const campaign = await transaction.campaign.findFirst({
          where: { id: recommendation.campaignId, ...tenant, status: { not: "ARCHIVED" } },
          select: { id: true },
        });
        if (!campaign) throw new HttpError(422, "CAMPAIGN_INVALID", "Campagne invalide.");
      }
      const locked = await transaction.directorRecommendation.updateMany({
        where: { id, ...tenant, contentId: null, status: { in: ["NEW", "VIEWED", "ACCEPTED"] } },
        data: { status: "ACCEPTED", actedAt: this.clock.now(), actedById: actorId },
      });
      if (!locked.count)
        throw new HttpError(409, "DIRECTOR_RECOMMENDATION_NOT_ACTIONABLE", "Recommandation déjà traitée.");
      const content = await this.contentCreation.createDraftInTransaction(transaction, {
        tenant,
        actorId,
        title: input.title,
        body: input.body,
        hashtags: input.hashtags,
        ...(input.cta !== undefined ? { cta: input.cta } : {}),
        ...(input.tone !== undefined ? { tone: input.tone } : {}),
        ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
        ...(recommendation.objectiveType ? { objective: recommendation.objectiveType } : {}),
        ...(recommendation.campaignId ? { campaignId: recommendation.campaignId } : {}),
      });
      await transaction.directorRecommendation.update({
        where: { id },
        data: { contentId: content.id, status: "COMPLETED", actedAt: this.clock.now(), actedById: actorId },
      });
      await transaction.auditLog.createMany({
        data: [
          {
            ...tenant,
            actorId,
            action: "director.recommendation_accepted",
            entityType: "director_recommendation",
            entityId: id,
            metadata: {},
          },
          {
            ...tenant,
            actorId,
            action: "director.draft_created",
            entityType: "director_recommendation",
            entityId: id,
            metadata: { contentId: content.id, status: "DRAFT" },
          },
        ],
      });
      if (recommendation.analysis.triggeredById && recommendation.analysis.triggeredById !== actorId)
        await transaction.notification.create({
          data: {
            ...tenant,
            recipientId: recommendation.analysis.triggeredById,
            actorId,
            contentId: content.id,
            recommendationId: id,
            type: "DIRECTOR_RECOMMENDATION_ACCEPTED",
            payload: { status: "DRAFT" },
          },
        });
      return { content, reused: false };
    });
  }

  private transition(
    tenant: Tenant,
    actorId: string,
    id: string,
    target: DirectorRecommendationStatus,
    sources: DirectorRecommendationStatus[],
    action: string,
    data: Prisma.DirectorRecommendationUpdateManyMutationInput = {},
    metadata: Prisma.InputJsonObject = {},
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.directorRecommendation.findFirst({
        where: { id, ...tenant },
        select: { id: true, status: true },
      });
      if (!current)
        throw new HttpError(404, "DIRECTOR_RECOMMENDATION_NOT_FOUND", "Recommandation introuvable.");
      if (current.status === target)
        return transaction.directorRecommendation.findFirstOrThrow({
          where: { id, ...tenant },
          select: recommendationSelect,
        });
      if (!sources.includes(current.status))
        throw new HttpError(
          409,
          "DIRECTOR_RECOMMENDATION_TRANSITION_INVALID",
          "Transition de recommandation interdite.",
        );
      const updated = await transaction.directorRecommendation.updateMany({
        where: { id, ...tenant, status: current.status },
        data: {
          ...data,
          status: target,
          ...(target === "ACCEPTED" ? { actedAt: this.clock.now() } : {}),
        },
      });
      if (!updated.count) {
        return transaction.directorRecommendation.findFirstOrThrow({
          where: { id, ...tenant },
          select: recommendationSelect,
        });
      }
      if (target === "ACCEPTED" || target === "COMPLETED") {
        await transaction.directorRecommendation.update({
          where: { id },
          data: { actedBy: { connect: { id: actorId } } },
        });
      } else if (target === "DISMISSED") {
        await transaction.directorRecommendation.update({
          where: { id },
          data: { dismissedBy: { connect: { id: actorId } } },
        });
      }
      await transaction.auditLog.create({
        data: { ...tenant, actorId, action, entityType: "director_recommendation", entityId: id, metadata },
      });
      return transaction.directorRecommendation.findFirstOrThrow({
        where: { id, ...tenant },
        select: recommendationSelect,
      });
    });
  }
}
