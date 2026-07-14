import type { PrismaClient, User } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";

export type SupabaseIdentity = {
  supabaseAuthId: string;
  email?: string;
  fullName?: string;
};

export class UserSyncService {
  constructor(private readonly prisma: PrismaClient) {}

  async sync(identity: SupabaseIdentity): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseAuthId: identity.supabaseAuthId },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          ...(identity.email && identity.email !== existing.email ? { email: identity.email } : {}),
          ...(!existing.fullName && identity.fullName ? { fullName: identity.fullName } : {}),
        },
      });
    }

    if (!identity.email) {
      throw new HttpError(422, "AUTH_EMAIL_MISSING", "L’adresse e-mail du compte est requise.");
    }

    return this.prisma.user.create({
      data: {
        supabaseAuthId: identity.supabaseAuthId,
        email: identity.email,
        fullName: identity.fullName ?? "",
      },
    });
  }
}
