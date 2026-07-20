import { env } from "@/lib/env";
import { DataTransportError, type TenantRequest } from "@/lib/data-transport";

export { DataTransportError as ApiError } from "@/lib/data-transport";
export type { TenantRequest } from "@/lib/data-transport";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  tenant?: TenantRequest,
  accessToken?: string,
): Promise<T> {
  if (!accessToken) throw new DataTransportError(401, "AUTH_REQUIRED", "Authentification requise.");

  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${accessToken}`);
  headers.set("content-type", "application/json");
  if (tenant) {
    headers.set("x-organization-id", tenant.organizationId);
    headers.set("x-workspace-id", tenant.workspaceId);
  }

  const response = await fetch(`${env.VITE_API_URL}${path}`, { ...init, headers });
  const payload = (await response.json()) as {
    data?: T;
    error?: { code: string; message: string; details?: unknown };
  };
  if (!response.ok || !payload.data) {
    throw new DataTransportError(
      response.status,
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "La requête a échoué.",
      payload.error?.details,
    );
  }
  return payload.data;
}
