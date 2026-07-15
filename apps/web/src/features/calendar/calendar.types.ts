export type ContentStatus =
  "DRAFT" | "READY_FOR_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type CalendarItem = {
  id: string;
  title: string;
  status: ContentStatus;
  platform: "LINKEDIN";
  scheduledAt: string | null;
  timezone: string;
  updatedAt: string;
  author: { id: string; fullName: string; avatarPath: string | null };
  assignee: { id: string; fullName: string; avatarPath: string | null } | null;
  campaign: { id: string; name: string; color: string } | null;
  _count: { comments: number };
};

export type Campaign = {
  id: string;
  name: string;
  color: string;
  status: string;
  _count?: { contentItems: number };
};
