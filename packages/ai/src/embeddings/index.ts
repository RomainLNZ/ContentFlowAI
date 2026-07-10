export type EmbeddingInput = { id: string; content: string; metadata?: Readonly<Record<string, unknown>> };
export type EmbeddingVector = { id: string; vector: readonly number[]; dimensions: number };

export interface EmbeddingProvider {
  embed(inputs: readonly EmbeddingInput[]): Promise<readonly EmbeddingVector[]>;
}
