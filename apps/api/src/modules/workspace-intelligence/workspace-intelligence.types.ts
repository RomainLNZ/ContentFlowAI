import type {
  CampaignStatus,
  CommunicationObjectiveType,
  ContentPlatform,
  ContentStatus,
} from "@prisma/client";

export type WorkspaceTenant = { organizationId: string; workspaceId: string };

export type WorkspaceIntelligenceSource = {
  organization: {
    name: string;
    websiteUrl: string | null;
    industry: string | null;
    description: string | null;
    mission: string | null;
    values: readonly string[];
    communicationTone: string | null;
    forbiddenWords: readonly string[];
    favoriteExpressions: readonly string[];
  };
  brandProfile: {
    productsServices: readonly string[];
    targetAudiences: readonly string[];
  } | null;
  preference: { desiredWeeklyFrequency: number; silenceThresholdDays: number } | null;
  objectives: readonly { type: CommunicationObjectiveType; isPrimary: boolean }[];
  campaigns: readonly {
    id: string;
    name: string;
    status: CampaignStatus;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  contents: readonly {
    id: string;
    status: ContentStatus;
    platform: ContentPlatform;
    objective: CommunicationObjectiveType | null;
    campaignId: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type CountByStatus = Readonly<Record<ContentStatus, number>>;

export type WorkspaceIntelligenceSnapshot = {
  version: 1;
  organizationId: string;
  workspaceId: string;
  generatedAt: string;
  window: { from: string; to: string; lookbackDays: number; horizonDays: number };
  brandContext: {
    organizationName: string;
    industry: string | null;
    mission: string | null;
    values: readonly string[];
    communicationTone: string | null;
    forbiddenWords: readonly string[];
    favoriteExpressions: readonly string[];
    productsServices: readonly string[];
    targetAudiences: readonly string[];
  };
  cadence: {
    desiredWeeklyFrequency: number;
    observedWeeklyFrequency: number;
    publishedCount: number;
    lastPublishedAt: string | null;
    daysSinceLastPublication: number | null;
    silenceThresholdDays: number;
    isBelowTarget: boolean;
  };
  publicationGaps: readonly { from: string; to: string; days: number; ongoing: boolean }[];
  campaignCoverage: readonly {
    campaignId: string;
    name: string;
    status: CampaignStatus;
    contentCount: number;
    actionableContentCount: number;
    coverageState: "EMPTY" | "INSUFFICIENT" | "COVERED";
    workflow: CountByStatus;
  }[];
  objectiveCoverage: readonly {
    objective: CommunicationObjectiveType;
    isPrimary: boolean;
    contentCount: number;
    share: number;
    underrepresented: boolean;
  }[];
  blockedContents: readonly {
    contentId: string;
    status: ContentStatus;
    reason: "REVIEW_WAITING" | "CHANGES_NOT_ADDRESSED" | "APPROVED_NOT_SCHEDULED" | "SCHEDULE_MISSED";
    blockedSince: string;
    ageHours: number;
  }[];
  brandProfileCompleteness: {
    score: number;
    completedFields: number;
    totalFields: number;
    missingFields: readonly string[];
  };
  aggregates: {
    platforms: readonly { platform: ContentPlatform; count: number; publishedCount: number }[];
    campaigns: readonly { campaignId: string | null; count: number }[];
    objectives: readonly { objective: CommunicationObjectiveType | null; count: number }[];
    workflow: CountByStatus;
  };
};
