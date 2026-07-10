export type PromptVariables = Readonly<Record<string, string | number | boolean>>;
export type PromptTemplate = {
  key: string;
  version: number;
  description: string;
  system: string;
  user: string;
  requiredVariables: readonly string[];
  metadata?: Readonly<Record<string, string>>;
};

export interface PromptSource {
  get(key: string, version?: number): Promise<PromptTemplate | null>;
}

export type RenderedPrompt = { key: string; version: number; system: string; user: string };
