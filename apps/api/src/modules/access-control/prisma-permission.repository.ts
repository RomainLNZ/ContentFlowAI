import type { PrismaClient } from "@prisma/client";
import type { AuthorizationContext, PermissionRepository } from "./access-control.types.js";

const permissionSelect = {
  role: { select: { permissions: { select: { permission: { select: { key: true } } } } } },
} as const;

export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listEffectivePermissionKeys(context: AuthorizationContext): Promise<readonly string[]> {
    const [user, workspaceMemberships, teamMemberships] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: context.userId },
        select: {
          platformRole: { select: { permissions: { select: { permission: { select: { key: true } } } } } },
          organizationMemberships: {
            where: { organizationId: context.organizationId, status: "ACTIVE" },
            select: permissionSelect,
          },
        },
      }),
      context.workspaceId
        ? this.prisma.workspaceMembership.findMany({
            where: { userId: context.userId, workspaceId: context.workspaceId, status: "ACTIVE" },
            select: permissionSelect,
          })
        : Promise.resolve([]),
      context.teamId
        ? this.prisma.teamMembership.findMany({
            where: { userId: context.userId, teamId: context.teamId, status: "ACTIVE" },
            select: permissionSelect,
          })
        : Promise.resolve([]),
    ]);
    if (!user) return [];

    const keys = new Set<string>();
    for (const item of user.platformRole?.permissions ?? []) keys.add(item.permission.key);
    for (const membership of user.organizationMemberships)
      for (const item of membership.role.permissions) keys.add(item.permission.key);
    for (const membership of workspaceMemberships)
      for (const item of membership.role.permissions) keys.add(item.permission.key);
    for (const membership of teamMemberships)
      for (const item of membership.role.permissions) keys.add(item.permission.key);
    return [...keys];
  }
}
