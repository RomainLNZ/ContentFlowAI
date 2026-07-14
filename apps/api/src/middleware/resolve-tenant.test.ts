import type { PrismaClient, User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createTenantMiddleware } from "./resolve-tenant.js";

const organizationId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";

function requestFor(headers: Record<string, string>) {
  return {
    currentUser: { id: "33333333-3333-4333-8333-333333333333" } as User,
    header: (name: string) => headers[name.toLowerCase()],
  } as Request;
}

describe("createTenantMiddleware", () => {
  it("refuse un workspace qui n’appartient pas à l’organisation demandée", async () => {
    const prisma = {
      organizationMembership: { findFirst: vi.fn().mockResolvedValue({ organizationId }) },
      workspace: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaClient;
    const next = vi.fn() as NextFunction;
    await createTenantMiddleware(prisma)(
      requestFor({ "x-organization-id": organizationId, "x-workspace-id": workspaceId }),
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403, code: "TENANT_ACCESS_DENIED" }));
  });

  it("résout le tenant après validation de l’adhésion et du workspace", async () => {
    const prisma = {
      organizationMembership: { findFirst: vi.fn().mockResolvedValue({ organizationId }) },
      workspace: { findFirst: vi.fn().mockResolvedValue({ id: workspaceId }) },
    } as unknown as PrismaClient;
    const request = requestFor({ "x-organization-id": organizationId, "x-workspace-id": workspaceId });
    const next = vi.fn() as NextFunction;
    await createTenantMiddleware(prisma)(request, {} as Response, next);
    expect(request.tenant).toEqual({ organizationId, workspaceId });
    expect(next).toHaveBeenCalledWith();
  });
});
