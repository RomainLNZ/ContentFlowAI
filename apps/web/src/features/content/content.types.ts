export type ContentItem = {
  id: string;
  title: string;
  body: string;
  status:
    "DRAFT" | "READY_FOR_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  cta?: string | null;
  hashtags: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  timezone: string;
  campaignId?: string | null;
  assigneeId?: string | null;
  reviewerId?: string | null;
  author?: { id: string; fullName: string };
  assignee?: { id: string; fullName: string } | null;
  reviewer?: { id: string; fullName: string } | null;
  campaign?: { id: string; name: string; color: string } | null;
  _count?: { comments: number };
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
