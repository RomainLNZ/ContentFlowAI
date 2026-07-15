import { CampaignStatus, ContentPlatform, ContentStatus } from "@prisma/client";
import type { CommunicationObjectiveType } from "@prisma/client";
import type {
  CountByStatus,
  WorkspaceIntelligenceSnapshot,
  WorkspaceIntelligenceSource,
  WorkspaceTenant,
} from "./workspace-intelligence.types.js";

export interface IntelligenceClock {
  now(): Date;
}

export const systemIntelligenceClock: IntelligenceClock = { now: () => new Date() };

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const LOOKBACK_DAYS = 30;
const HORIZON_DAYS = 30;
const DEFAULT_WEEKLY_FREQUENCY = 3;
const DEFAULT_SILENCE_DAYS = 7;
const CONTENT_STATUSES = Object.values(ContentStatus);
const ACTIONABLE_CAMPAIGN_STATUSES = new Set<ContentStatus>([
  ContentStatus.APPROVED,
  ContentStatus.SCHEDULED,
  ContentStatus.PUBLISHED,
]);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function iso(date: Date): string {
  return date.toISOString();
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function workflowCounts(contents: WorkspaceIntelligenceSource["contents"]): CountByStatus {
  const counts = Object.fromEntries(CONTENT_STATUSES.map((status) => [status, 0])) as Record<
    ContentStatus,
    number
  >;
  for (const content of contents) counts[content.status] += 1;
  return counts;
}

function publicationGaps(
  publicationDates: readonly Date[],
  from: Date,
  now: Date,
  thresholdDays: number,
): WorkspaceIntelligenceSnapshot["publicationGaps"] {
  const publishedDays = new Set(publicationDates.map((date) => iso(startOfUtcDay(date))));
  const gaps: Array<{ from: string; to: string; days: number; ongoing: boolean }> = [];
  let gapStart: Date | null = null;

  for (let day = startOfUtcDay(from); day <= startOfUtcDay(now); day = addDays(day, 1)) {
    const hasPublication = publishedDays.has(iso(day));
    if (!hasPublication && !gapStart) gapStart = day;
    if (hasPublication && gapStart) {
      const days = Math.round((day.getTime() - gapStart.getTime()) / DAY_MS);
      if (days >= thresholdDays)
        gaps.push({ from: iso(gapStart), to: iso(addDays(day, -1)), days, ongoing: false });
      gapStart = null;
    }
  }

  if (gapStart) {
    const end = startOfUtcDay(now);
    const days = Math.round((end.getTime() - gapStart.getTime()) / DAY_MS) + 1;
    if (days >= thresholdDays) gaps.push({ from: iso(gapStart), to: iso(end), days, ongoing: true });
  }
  return gaps;
}

function brandCompleteness(source: WorkspaceIntelligenceSource) {
  const checks: ReadonlyArray<[string, boolean]> = [
    ["websiteUrl", Boolean(source.organization.websiteUrl)],
    ["industry", Boolean(source.organization.industry)],
    ["description", Boolean(source.organization.description)],
    ["mission", Boolean(source.organization.mission)],
    ["values", source.organization.values.length > 0],
    ["communicationTone", Boolean(source.organization.communicationTone)],
    ["favoriteExpressions", source.organization.favoriteExpressions.length > 0],
    ["productsServices", Boolean(source.brandProfile?.productsServices.length)],
    ["targetAudiences", Boolean(source.brandProfile?.targetAudiences.length)],
  ];
  const missingFields = checks.filter(([, complete]) => !complete).map(([field]) => field);
  const completedFields = checks.length - missingFields.length;
  return {
    score: Math.round((completedFields / checks.length) * 100),
    completedFields,
    totalFields: checks.length,
    missingFields,
  };
}

export class WorkspaceIntelligenceSnapshotBuilder {
  constructor(private readonly clock: IntelligenceClock = systemIntelligenceClock) {}

  build(tenant: WorkspaceTenant, source: WorkspaceIntelligenceSource): WorkspaceIntelligenceSnapshot {
    const now = this.clock.now();
    const from = addDays(now, -LOOKBACK_DAYS);
    const to = addDays(now, HORIZON_DAYS);
    const desiredWeeklyFrequency = source.preference?.desiredWeeklyFrequency ?? DEFAULT_WEEKLY_FREQUENCY;
    const silenceThresholdDays = source.preference?.silenceThresholdDays ?? DEFAULT_SILENCE_DAYS;
    const allPublished = source.contents
      .filter((content) => content.status === ContentStatus.PUBLISHED && content.publishedAt)
      .filter((content) => content.publishedAt! <= now)
      .sort((left, right) => left.publishedAt!.getTime() - right.publishedAt!.getTime());
    const published = allPublished.filter((content) => content.publishedAt! >= from);
    const lastPublishedAt = allPublished.at(-1)?.publishedAt ?? null;
    const observedWeeklyFrequency = round(published.length / (LOOKBACK_DAYS / 7));

    const relevantContents = source.contents.filter((content) => {
      const activityDate = content.publishedAt ?? content.scheduledAt ?? content.createdAt;
      return activityDate >= from && activityDate <= to && content.status !== ContentStatus.ARCHIVED;
    });
    const totalObjectiveContents = relevantContents.filter((content) => content.objective).length;
    const objectiveTargetShare = source.objectives.length ? 1 / source.objectives.length : 0;

    const campaignCoverage = [...source.campaigns]
      .filter(
        (campaign) => campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.ACTIVE,
      )
      .filter(
        (campaign) =>
          (!campaign.endDate || campaign.endDate >= from) &&
          (!campaign.startDate || campaign.startDate <= to),
      )
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((campaign) => {
        const contents = relevantContents.filter((content) => content.campaignId === campaign.id);
        const actionableContentCount = contents.filter((content) =>
          ACTIONABLE_CAMPAIGN_STATUSES.has(content.status),
        ).length;
        const coverageState =
          contents.length === 0
            ? "EMPTY"
            : contents.length < 2 || actionableContentCount === 0
              ? "INSUFFICIENT"
              : "COVERED";
        return {
          campaignId: campaign.id,
          name: campaign.name,
          status: campaign.status,
          contentCount: contents.length,
          actionableContentCount,
          coverageState,
          workflow: workflowCounts(contents),
        } as const;
      });

    const objectiveCoverage = [...source.objectives]
      .sort((left, right) => left.type.localeCompare(right.type))
      .map((objective) => {
        const contentCount = relevantContents.filter(
          (content) => content.objective === objective.type,
        ).length;
        const share = totalObjectiveContents ? round(contentCount / totalObjectiveContents) : 0;
        return {
          objective: objective.type,
          isPrimary: objective.isPrimary,
          contentCount,
          share,
          underrepresented: contentCount === 0 || share < objectiveTargetShare * 0.5,
        };
      });

    const blockedContents: Array<WorkspaceIntelligenceSnapshot["blockedContents"][number]> = [];
    for (const content of source.contents) {
      const ageHours = Math.floor((now.getTime() - content.updatedAt.getTime()) / HOUR_MS);
      if (content.status === ContentStatus.READY_FOR_REVIEW && ageHours >= 48) {
        blockedContents.push({
          contentId: content.id,
          status: content.status,
          reason: "REVIEW_WAITING",
          blockedSince: iso(content.updatedAt),
          ageHours,
        });
      } else if (content.status === ContentStatus.CHANGES_REQUESTED && ageHours >= 72) {
        blockedContents.push({
          contentId: content.id,
          status: content.status,
          reason: "CHANGES_NOT_ADDRESSED",
          blockedSince: iso(content.updatedAt),
          ageHours,
        });
      } else if (content.status === ContentStatus.APPROVED && !content.scheduledAt && ageHours >= 72) {
        blockedContents.push({
          contentId: content.id,
          status: content.status,
          reason: "APPROVED_NOT_SCHEDULED",
          blockedSince: iso(content.updatedAt),
          ageHours,
        });
      } else if (
        content.status === ContentStatus.SCHEDULED &&
        content.scheduledAt &&
        content.scheduledAt < now &&
        ageHours >= 24
      ) {
        blockedContents.push({
          contentId: content.id,
          status: content.status,
          reason: "SCHEDULE_MISSED",
          blockedSince: iso(content.scheduledAt),
          ageHours: Math.floor((now.getTime() - content.scheduledAt.getTime()) / HOUR_MS),
        });
      }
    }
    blockedContents.sort((left, right) => left.contentId.localeCompare(right.contentId));

    const platforms = Object.values(ContentPlatform).map((platform) => ({
      platform,
      count: relevantContents.filter((content) => content.platform === platform).length,
      publishedCount: published.filter((content) => content.platform === platform).length,
    }));
    const campaignIds = [...new Set(relevantContents.map((content) => content.campaignId))].sort((a, b) =>
      (a ?? "").localeCompare(b ?? ""),
    );
    const objectiveTypes = [
      ...new Set<CommunicationObjectiveType | null>(relevantContents.map((content) => content.objective)),
    ].sort((a, b) => (a ?? "").localeCompare(b ?? ""));

    return {
      version: 1,
      ...tenant,
      generatedAt: iso(now),
      window: { from: iso(from), to: iso(to), lookbackDays: LOOKBACK_DAYS, horizonDays: HORIZON_DAYS },
      brandContext: {
        organizationName: source.organization.name,
        industry: source.organization.industry,
        mission: source.organization.mission,
        values: [...source.organization.values],
        communicationTone: source.organization.communicationTone,
        forbiddenWords: [...source.organization.forbiddenWords],
        favoriteExpressions: [...source.organization.favoriteExpressions],
        productsServices: [...(source.brandProfile?.productsServices ?? [])],
        targetAudiences: [...(source.brandProfile?.targetAudiences ?? [])],
      },
      cadence: {
        desiredWeeklyFrequency,
        observedWeeklyFrequency,
        publishedCount: published.length,
        lastPublishedAt: lastPublishedAt ? iso(lastPublishedAt) : null,
        daysSinceLastPublication: lastPublishedAt
          ? Math.floor((now.getTime() - lastPublishedAt.getTime()) / DAY_MS)
          : null,
        silenceThresholdDays,
        isBelowTarget: observedWeeklyFrequency < desiredWeeklyFrequency,
      },
      publicationGaps: publicationGaps(
        published.map((content) => content.publishedAt!),
        from,
        now,
        silenceThresholdDays,
      ),
      campaignCoverage,
      objectiveCoverage,
      blockedContents,
      brandProfileCompleteness: brandCompleteness(source),
      aggregates: {
        platforms,
        campaigns: campaignIds.map((campaignId) => ({
          campaignId,
          count: relevantContents.filter((content) => content.campaignId === campaignId).length,
        })),
        objectives: objectiveTypes.map((objective) => ({
          objective,
          count: relevantContents.filter((content) => content.objective === objective).length,
        })),
        workflow: workflowCounts(relevantContents),
      },
    };
  }
}
