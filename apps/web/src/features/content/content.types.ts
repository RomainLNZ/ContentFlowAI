export type ContentItem = {
  id: string;
  title: string;
  body: string;
  status: "DRAFT" | "READY_FOR_REVIEW" | "ARCHIVED";
  objective?: string | null;
  tone?: string | null;
  targetAudience?: string | null;
  updatedAt: string;
};

export type ContentVariant = {
  id: string;
  style: "DIRECT_CONCISE" | "EXPERT_EDUCATIONAL" | "HUMAN_ENGAGING";
  angle: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  rationale: string;
  confidence: string;
  warnings: string[];
};
