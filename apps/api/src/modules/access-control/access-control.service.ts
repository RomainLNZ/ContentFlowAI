import type { AuthorizationContext, PermissionRepository } from "./access-control.types.js";

export class AccessControlService {
  constructor(private readonly repository: PermissionRepository) {}

  async can(context: AuthorizationContext, permissionKey: string): Promise<boolean> {
    const permissions = await this.repository.listEffectivePermissionKeys(context);
    return permissions.includes(permissionKey);
  }

  async require(context: AuthorizationContext, permissionKey: string): Promise<void> {
    if (!(await this.can(context, permissionKey))) {
      const error = new Error(`Missing permission: ${permissionKey}`);
      error.name = "AuthorizationError";
      throw error;
    }
  }
}
