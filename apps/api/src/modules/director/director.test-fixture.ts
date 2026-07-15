import { CampaignStatus, CommunicationObjectiveType, ContentPlatform, ContentStatus } from "@prisma/client";
import type { WorkspaceIntelligenceSnapshot } from "../workspace-intelligence/workspace-intelligence.types.js";

const workflow = {
  DRAFT: 0,
  READY_FOR_REVIEW: 0,
  CHANGES_REQUESTED: 0,
  APPROVED: 0,
  SCHEDULED: 0,
  PUBLISHED: 0,
  ARCHIVED: 0,
};

export function directorSnapshot(): WorkspaceIntelligenceSnapshot {
  return {
    version: 1,
    organizationId: "11111111-1111-4111-8111-111111111111",
    workspaceId: "22222222-2222-4222-8222-222222222222",
    generatedAt: "2026-07-15T12:00:00.000Z",
    window: {
      from: "2026-06-15T12:00:00.000Z",
      to: "2026-08-14T12:00:00.000Z",
      lookbackDays: 30,
      horizonDays: 30,
    },
    brandContext: {
      organizationName: "FlowPilot",
      industry: "SaaS",
      mission: "Rendre la communication proactive",
      values: ["Clarté"],
      communicationTone: "Direct",
      forbiddenWords: ["garanti"],
      favoriteExpressions: ["Allons-y"],
      productsServices: ["Communication OS"],
      targetAudiences: ["PME"],
    },
    cadence: {
      desiredWeeklyFrequency: 3,
      observedWeeklyFrequency: 0.47,
      publishedCount: 2,
      lastPublishedAt: "2026-07-05T12:00:00.000Z",
      daysSinceLastPublication: 10,
      silenceThresholdDays: 7,
      isBelowTarget: true,
    },
    publicationGaps: [
      {
        from: "2026-07-06T00:00:00.000Z",
        to: "2026-07-15T00:00:00.000Z",
        days: 10,
        ongoing: true,
      },
    ],
    campaignCoverage: [
      {
        campaignId: "campaign-a",
        name: "Lancement été",
        status: CampaignStatus.ACTIVE,
        contentCount: 0,
        actionableContentCount: 0,
        coverageState: "EMPTY",
        workflow,
      },
    ],
    objectiveCoverage: [
      {
        objective: CommunicationObjectiveType.AWARENESS,
        isPrimary: true,
        contentCount: 0,
        share: 0,
        underrepresented: true,
      },
    ],
    blockedContents: [
      {
        contentId: "content-a",
        status: ContentStatus.READY_FOR_REVIEW,
        reason: "REVIEW_WAITING",
        blockedSince: "2026-07-11T12:00:00.000Z",
        ageHours: 96,
      },
    ],
    brandProfileCompleteness: {
      score: 78,
      completedFields: 7,
      totalFields: 9,
      missingFields: ["favoriteExpressions", "targetAudiences"],
    },
    aggregates: {
      platforms: [{ platform: ContentPlatform.LINKEDIN, count: 3, publishedCount: 2 }],
      campaigns: [{ campaignId: "campaign-a", count: 0 }],
      objectives: [{ objective: CommunicationObjectiveType.AWARENESS, count: 0 }],
      workflow: { ...workflow, READY_FOR_REVIEW: 1, PUBLISHED: 2 },
    },
  };
}
