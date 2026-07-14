import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        supabaseUserId: string;
        email?: string;
        fullName?: string;
      };
      currentUser?: User;
      tenant?: {
        organizationId: string;
        workspaceId: string;
      };
    }
  }
}

export {};
