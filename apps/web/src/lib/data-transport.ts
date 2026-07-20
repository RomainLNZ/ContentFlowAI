export type TenantRequest = { organizationId: string; workspaceId: string };

export class DataTransportError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export type DataTransport = {
  request<T>(path: string, init?: RequestInit, tenant?: TenantRequest): Promise<T>;
};
