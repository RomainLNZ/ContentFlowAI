import type { AiExecutionContext } from "../shared";

export type VectorDocument = {
  id: string;
  content: string;
  vector: readonly number[];
  metadata: Readonly<Record<string, unknown>>;
};
export type VectorSearchResult = { document: VectorDocument; score: number };
export interface VectorStore {
  upsert(context: AiExecutionContext, documents: readonly VectorDocument[]): Promise<void>;
  search(
    context: AiExecutionContext,
    vector: readonly number[],
    limit: number,
    filter?: Readonly<Record<string, unknown>>,
  ): Promise<readonly VectorSearchResult[]>;
  delete(context: AiExecutionContext, ids: readonly string[]): Promise<void>;
}
