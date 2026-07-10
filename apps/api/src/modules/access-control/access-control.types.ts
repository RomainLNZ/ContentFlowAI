export type AuthorizationContext = {
  userId: string;
  organizationId: string;
  workspaceId?: string;
  teamId?: string;
};

export interface PermissionRepository {
  listEffectivePermissionKeys(context: AuthorizationContext): Promise<readonly string[]>;
}
