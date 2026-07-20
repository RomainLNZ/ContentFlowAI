import type { DataTransport, TenantRequest } from "@/lib/data-transport";
import type {
  DirectorOverview,
  DirectorRecommendation,
  PreparedDraft,
  RecommendationPage,
} from "./today.types";

export const getDirectorOverview = (transport: DataTransport, tenant: TenantRequest) =>
  transport.request<DirectorOverview>("/v1/director/overview", {}, tenant);

export const getRecentRecommendations = (transport: DataTransport, tenant: TenantRequest) =>
  transport.request<RecommendationPage>("/v1/director/recommendations?page=1&pageSize=8", {}, tenant);

export const runDirectorAnalysis = (transport: DataTransport, tenant: TenantRequest) =>
  transport.request("/v1/director/analyses", { method: "POST" }, tenant);

export const markRecommendationViewed = (transport: DataTransport, tenant: TenantRequest, id: string) =>
  transport.request<DirectorRecommendation>(`/v1/director/recommendations/${id}/view`, { method: "POST" }, tenant);

export const acceptRecommendation = (transport: DataTransport, tenant: TenantRequest, id: string) =>
  transport.request<DirectorRecommendation>(`/v1/director/recommendations/${id}/accept`, { method: "POST" }, tenant);

export const dismissRecommendation = (transport: DataTransport, tenant: TenantRequest, id: string) =>
  transport.request<DirectorRecommendation>(
    `/v1/director/recommendations/${id}/dismiss`,
    { method: "POST", body: JSON.stringify({ reason: "NOT_RELEVANT" }) },
    tenant,
  );

export const prepareRecommendationDraft = (transport: DataTransport, tenant: TenantRequest, id: string) =>
  transport.request<PreparedDraft>(`/v1/director/recommendations/${id}/prepare-draft`, { method: "POST" }, tenant);
