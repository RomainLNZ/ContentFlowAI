import { CampaignStatus, CommunicationObjectiveType, ContentPlatform, ContentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { WorkspaceIntelligenceSnapshotBuilder } from "./workspace-intelligence.builder.js";
import type { WorkspaceIntelligenceSource } from "./workspace-intelligence.types.js";

const NOW = new Date("2026-07-15T12:00:00.000Z");
const tenant = { organizationId: "org-a", workspaceId: "workspace-a" };
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);

function source(): WorkspaceIntelligenceSource {
  return {
    organization: {
      name: "FlowPilot",
      websiteUrl: "https://flowpilot.app",
      industry: "SaaS",
      description: "Pilotage éditorial",
      mission: "Rendre la communication proactive",
      values: ["Clarté"],
      communicationTone: "Direct",
      forbiddenWords: [],
      favoriteExpressions: ["Allons-y"],
    },
    brandProfile: { productsServices: ["Communication OS"], targetAudiences: ["PME"] },
    preference: { desiredWeeklyFrequency: 2, silenceThresholdDays: 7 },
    objectives: [
      { type: CommunicationObjectiveType.AWARENESS, isPrimary: true },
      { type: CommunicationObjectiveType.RECRUITMENT, isPrimary: false },
    ],
    campaigns: [
      {
        id: "campaign-covered",
        name: "Lancement",
        status: CampaignStatus.ACTIVE,
        startDate: daysAgo(5),
        endDate: new Date(NOW.getTime() + 10 * 86_400_000),
      },
      {
        id: "campaign-empty",
        name: "Recrutement",
        status: CampaignStatus.ACTIVE,
        startDate: daysAgo(2),
        endDate: new Date(NOW.getTime() + 20 * 86_400_000),
      },
    ],
    contents: [
      {
        id: "published-1",
        status: ContentStatus.PUBLISHED,
        platform: ContentPlatform.LINKEDIN,
        objective: CommunicationObjectiveType.AWARENESS,
        campaignId: "campaign-covered",
        scheduledAt: daysAgo(10),
        publishedAt: daysAgo(10),
        createdAt: daysAgo(15),
        updatedAt: daysAgo(10),
      },
      {
        id: "scheduled-1",
        status: ContentStatus.SCHEDULED,
        platform: ContentPlatform.LINKEDIN,
        objective: CommunicationObjectiveType.AWARENESS,
        campaignId: "campaign-covered",
        scheduledAt: new Date(NOW.getTime() + 4 * 86_400_000),
        publishedAt: null,
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(2),
      },
      {
        id: "blocked-review",
        status: ContentStatus.READY_FOR_REVIEW,
        platform: ContentPlatform.LINKEDIN,
        objective: CommunicationObjectiveType.AWARENESS,
        campaignId: null,
        scheduledAt: null,
        publishedAt: null,
        createdAt: daysAgo(5),
        updatedAt: hoursAgo(50),
      },
    ],
  };
}

describe("WorkspaceIntelligenceSnapshotBuilder", () => {
  const builder = new WorkspaceIntelligenceSnapshotBuilder({ now: () => NOW });

  it("calcule les faits éditoriaux, agrégats et blocages sans contenu textuel", () => {
    const snapshot = builder.build(tenant, source());

    expect(snapshot.cadence).toMatchObject({
      desiredWeeklyFrequency: 2,
      publishedCount: 1,
      observedWeeklyFrequency: 0.23,
      daysSinceLastPublication: 10,
      isBelowTarget: true,
    });
    expect(snapshot.campaignCoverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ campaignId: "campaign-covered", coverageState: "COVERED" }),
        expect.objectContaining({ campaignId: "campaign-empty", coverageState: "EMPTY" }),
      ]),
    );
    expect(snapshot.objectiveCoverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objective: CommunicationObjectiveType.RECRUITMENT,
          underrepresented: true,
        }),
      ]),
    );
    expect(snapshot.blockedContents).toEqual([
      expect.objectContaining({ contentId: "blocked-review", reason: "REVIEW_WAITING", ageHours: 50 }),
    ]);
    expect(snapshot.brandProfileCompleteness.score).toBe(100);
    expect(snapshot.aggregates.platforms).toEqual([
      { platform: ContentPlatform.LINKEDIN, count: 3, publishedCount: 1 },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain("Pilotage éditorial sans limites");
  });

  it("détecte une période de silence en cours", () => {
    const snapshot = builder.build(tenant, { ...source(), contents: [] });
    expect(snapshot.publicationGaps).toEqual([expect.objectContaining({ days: 31, ongoing: true })]);
  });

  it("calcule la complétude à partir de champs explicitement bornés", () => {
    const data = source();
    const snapshot = builder.build(tenant, {
      ...data,
      organization: { ...data.organization, mission: null, values: [] },
      brandProfile: null,
    });
    expect(snapshot.brandProfileCompleteness).toEqual({
      score: 56,
      completedFields: 5,
      totalFields: 9,
      missingFields: ["mission", "values", "productsServices", "targetAudiences"],
    });
  });

  it("détecte chaque classe de blocage avec son seuil", () => {
    const data = source();
    const base = data.contents[0]!;
    const snapshot = builder.build(tenant, {
      ...data,
      contents: [
        {
          ...base,
          id: "review",
          status: ContentStatus.READY_FOR_REVIEW,
          publishedAt: null,
          updatedAt: hoursAgo(48),
        },
        {
          ...base,
          id: "changes",
          status: ContentStatus.CHANGES_REQUESTED,
          publishedAt: null,
          updatedAt: hoursAgo(72),
        },
        {
          ...base,
          id: "approved",
          status: ContentStatus.APPROVED,
          publishedAt: null,
          scheduledAt: null,
          updatedAt: hoursAgo(72),
        },
        {
          ...base,
          id: "missed",
          status: ContentStatus.SCHEDULED,
          publishedAt: null,
          scheduledAt: hoursAgo(25),
          updatedAt: hoursAgo(25),
        },
      ],
    });
    expect(snapshot.blockedContents.map(({ reason }) => reason).sort()).toEqual([
      "APPROVED_NOT_SCHEDULED",
      "CHANGES_NOT_ADDRESSED",
      "REVIEW_WAITING",
      "SCHEDULE_MISSED",
    ]);
  });

  it("est strictement reproductible avec la même source et la même horloge", () => {
    const data = source();
    expect(builder.build(tenant, data)).toEqual(builder.build(tenant, data));
  });
});
