export type AiCompletionRequest = {
  systemPrompt: string;
  userPrompt: string;
  organizationId: string;
};

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<string>;
}
