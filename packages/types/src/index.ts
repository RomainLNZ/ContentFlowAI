export type ApiSuccess<T> = { data: T; requestId: string };
export type ApiError = { error: { code: string; message: string; details?: unknown }; requestId: string };

export type HealthStatus = {
  status: "ok";
  service: "communicationos-api";
  version: string;
  timestamp: string;
};
