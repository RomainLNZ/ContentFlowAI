import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

export type TenantRequest = { organizationId: string; workspaceId: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  tenant?: TenantRequest,
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "AUTH_REQUIRED", "Authentification requise.");

  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
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
    throw new ApiError(
      response.status,
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "La requête a échoué.",
      payload.error?.details,
    );
  }
  return payload.data;
}
