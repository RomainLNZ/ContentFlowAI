import { apiRequest, type TenantRequest } from "@/lib/api-client";
import type {
  DirectorOverview,
  DirectorRecommendation,
  PreparedDraft,
  RecommendationPage,
} from "./today.types";

export const getDirectorOverview = (tenant: TenantRequest) =>
  apiRequest<DirectorOverview>("/v1/director/overview", {}, tenant);

export const getRecentRecommendations = (tenant: TenantRequest) =>
  apiRequest<RecommendationPage>("/v1/director/recommendations?page=1&pageSize=8", {}, tenant);

export const runDirectorAnalysis = (tenant: TenantRequest) =>
  apiRequest("/v1/director/analyses", { method: "POST" }, tenant);

export const markRecommendationViewed = (tenant: TenantRequest, id: string) =>
  apiRequest<DirectorRecommendation>(`/v1/director/recommendations/${id}/view`, { method: "POST" }, tenant);

export const acceptRecommendation = (tenant: TenantRequest, id: string) =>
  apiRequest<DirectorRecommendation>(`/v1/director/recommendations/${id}/accept`, { method: "POST" }, tenant);

export const dismissRecommendation = (tenant: TenantRequest, id: string) =>
  apiRequest<DirectorRecommendation>(
    `/v1/director/recommendations/${id}/dismiss`,
    { method: "POST", body: JSON.stringify({ reason: "NOT_RELEVANT" }) },
    tenant,
  );

export const prepareRecommendationDraft = (tenant: TenantRequest, id: string) =>
  apiRequest<PreparedDraft>(`/v1/director/recommendations/${id}/prepare-draft`, { method: "POST" }, tenant);
