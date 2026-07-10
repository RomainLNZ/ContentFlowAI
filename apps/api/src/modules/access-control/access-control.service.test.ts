import { describe, expect, it } from "vitest";
import { AccessControlService } from "./access-control.service.js";

describe("AccessControlService", () => {
  it("évalue une permission fournie dynamiquement par le repository", async () => {
    const service = new AccessControlService({
      listEffectivePermissionKeys: async () => ["content.read", "content.publish"],
    });
    await expect(service.can({ userId: "user", organizationId: "org" }, "content.publish")).resolves.toBe(
      true,
    );
    await expect(service.can({ userId: "user", organizationId: "org" }, "billing.manage")).resolves.toBe(
      false,
    );
  });
});
