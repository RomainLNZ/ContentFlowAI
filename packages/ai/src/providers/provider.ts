import type { ModelRequest, ModelResponse } from "../shared";

export type ProviderCapability = "text" | "vision" | "tools" | "json" | "embeddings" | "streaming";
export type ProviderDescriptor = {
  id: string;
  displayName: string;
  capabilities: readonly ProviderCapability[];
  status: "available" | "planned";
  configurationKeys: readonly string[];
};

export interface AiProvider {
  readonly descriptor: ProviderDescriptor;
  generate(request: ModelRequest, signal?: AbortSignal): Promise<ModelResponse>;
  isAvailable(): Promise<boolean>;
}
