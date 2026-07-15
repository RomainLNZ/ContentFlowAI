import type { ContentPlatform, ContentStatus, PrismaClient } from "@prisma/client";

type Tenant = { organizationId: string; workspaceId: string };

export class CalendarService {
  constructor(private readonly prisma: PrismaClient) {}

  list(
    tenant: Tenant,
    filters: {
      from: Date;
      to: Date;
      status?: ContentStatus[] | undefined;
      platform?: ContentPlatform[] | undefined;
      authorId?: string | undefined;
      assigneeId?: string | undefined;
      campaignId?: string | undefined;
      q?: string | undefined;
      includeUnscheduled: boolean;
    },
  ) {
    return this.prisma.contentItem.findMany({
      where: {
        ...tenant,
        ...(filters.includeUnscheduled
          ? { OR: [{ scheduledAt: { gte: filters.from, lt: filters.to } }, { scheduledAt: null }] }
          : { scheduledAt: { gte: filters.from, lt: filters.to } }),
        ...(filters.status?.length ? { status: { in: filters.status } } : {}),
        ...(filters.platform?.length ? { platform: { in: filters.platform } } : {}),
        ...(filters.authorId ? { authorId: filters.authorId } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters.q
          ? {
              AND: [
                {
                  OR: [
                    { title: { contains: filters.q, mode: "insensitive" } },
                    { body: { contains: filters.q, mode: "insensitive" } },
                  ],
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
        platform: true,
        scheduledAt: true,
        timezone: true,
        updatedAt: true,
        author: { select: { id: true, fullName: true, avatarPath: true } },
        assignee: { select: { id: true, fullName: true, avatarPath: true } },
        campaign: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: { where: { deletedAt: null } } } },
      },
      orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
      take: 2_000,
    });
  }
}
