import type { PrismaClient } from "@prisma/client";
import type { AiExecutionContext, CompanyMemory, CompanyMemoryProvider, MemoryItem } from "@flowpilot/ai";

export class PrismaCompanyMemoryProvider implements CompanyMemoryProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async load(context: AiExecutionContext): Promise<CompanyMemory> {
    const organization = await this.prisma.organization.findFirstOrThrow({
      where: { id: context.organizationId, archivedAt: null },
      select: {
        name: true,
        industry: true,
        description: true,
        mission: true,
        values: true,
        communicationTone: true,
        forbiddenWords: true,
        favoriteExpressions: true,
        updatedAt: true,
        brandProfiles: {
          where: { workspaceId: context.workspaceId },
          select: {
            productsServices: true,
            targetAudiences: true,
            formalityLevel: true,
            emojiUsage: true,
            updatedAt: true,
          },
          take: 1,
        },
        communicationObjectives: {
          where: { workspaceId: context.workspaceId },
          select: { type: true, isPrimary: true, createdAt: true },
        },
      },
    });
    const profile = organization.brandProfiles[0];
    const items: MemoryItem[] = [
      {
        id: "brand-identity",
        category: "brand_identity",
        content: JSON.stringify({
          name: organization.name,
          industry: organization.industry,
          description: organization.description,
          mission: organization.mission,
          values: organization.values,
        }),
        metadata: {},
        updatedAt: organization.updatedAt,
      },
      {
        id: "tone",
        category: "tone",
        content: JSON.stringify({
          communicationTone: organization.communicationTone,
          forbiddenWords: organization.forbiddenWords,
          favoriteExpressions: organization.favoriteExpressions,
          formalityLevel: profile?.formalityLevel,
          emojiUsage: profile?.emojiUsage,
        }),
        metadata: {},
        updatedAt: profile?.updatedAt ?? organization.updatedAt,
      },
      {
        id: "products",
        category: "products",
        content: JSON.stringify(profile?.productsServices ?? []),
        metadata: { targetAudiences: profile?.targetAudiences ?? [] },
        updatedAt: profile?.updatedAt ?? organization.updatedAt,
      },
      {
        id: "objectives",
        category: "preferences",
        content: JSON.stringify(organization.communicationObjectives),
        metadata: {},
        updatedAt: organization.communicationObjectives[0]?.createdAt ?? organization.updatedAt,
      },
    ];
    return { organizationId: context.organizationId, items, assembledAt: new Date() };
  }

  async search(context: AiExecutionContext, _query: string, limit: number): Promise<readonly MemoryItem[]> {
    return (await this.load(context)).items.slice(0, limit);
  }
}
