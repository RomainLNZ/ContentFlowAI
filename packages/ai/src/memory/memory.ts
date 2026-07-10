import type { AiExecutionContext } from "../shared";

export type MemoryCategory =
  "brand_identity" | "tone" | "products" | "services" | "faq" | "documents" | "history" | "preferences";
export type MemoryItem = {
  id: string;
  category: MemoryCategory;
  content: string;
  sourceId?: string;
  metadata: Readonly<Record<string, unknown>>;
  updatedAt: Date;
};
export type CompanyMemory = { organizationId: string; items: readonly MemoryItem[]; assembledAt: Date };

export interface CompanyMemoryProvider {
  load(context: AiExecutionContext, categories?: readonly MemoryCategory[]): Promise<CompanyMemory>;
  search(context: AiExecutionContext, query: string, limit: number): Promise<readonly MemoryItem[]>;
}

export interface MemoryFormatter {
  format(memory: CompanyMemory): string;
}

export class StructuredMemoryFormatter implements MemoryFormatter {
  format(memory: CompanyMemory): string {
    return memory.items.map((item) => `[${item.category}] ${item.content}`).join("\n");
  }
}
