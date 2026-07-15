import type { CommunicationObjectiveType, ContentPlatform, Prisma, PrismaClient } from "@prisma/client";

type Tenant = { organizationId: string; workspaceId: string };

export class ContentCreationService {
  constructor(private readonly prisma: PrismaClient) {}

  createDraftInTransaction(
    transaction: Prisma.TransactionClient,
    input: {
      tenant: Tenant;
      actorId: string;
      title: string;
      body: string;
      cta?: string | null;
      hashtags: string[];
      objective?: CommunicationObjectiveType;
      tone?: string;
      targetAudience?: string;
      campaignId?: string;
      platform?: ContentPlatform;
    },
  ) {
    return transaction.contentItem.create({
      data: {
        ...input.tenant,
        authorId: input.actorId,
        title: input.title,
        body: input.body,
        status: "DRAFT",
        platform: input.platform ?? "LINKEDIN",
        hashtags: input.hashtags,
        ...(input.cta !== undefined ? { cta: input.cta } : {}),
        ...(input.objective ? { objective: input.objective } : {}),
        ...(input.tone ? { tone: input.tone } : {}),
        ...(input.targetAudience ? { targetAudience: input.targetAudience } : {}),
        ...(input.campaignId ? { campaignId: input.campaignId } : {}),
      },
    });
  }

  createDraft(input: Parameters<ContentCreationService["createDraftInTransaction"]>[1]) {
    return this.prisma.$transaction((transaction) => this.createDraftInTransaction(transaction, input));
  }
}
