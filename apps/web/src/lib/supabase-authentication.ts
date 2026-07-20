import type { Session } from "@supabase/supabase-js";
import type { Authentication, AuthSession } from "@/lib/authentication";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseClient } from "@/lib/supabase";

function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return {
    accessToken: session.access_token,
    user: {
      id: session.user.id,
      ...(session.user.email ? { email: session.user.email } : {}),
      userMetadata: session.user.user_metadata,
    },
  };
}

export const supabaseAuthentication: Authentication = {
  configured: isSupabaseConfigured,

  async getSession() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return toAuthSession(data.session);
  },

  onAuthStateChange(listener) {
    const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) =>
      listener(toAuthSession(session)),
    );
    return () => data.subscription.unsubscribe();
  },

  async signInWithPassword(input) {
    const { error } = await getSupabaseClient().auth.signInWithPassword(input);
    if (error) throw error;
  },

  async signUp(input) {
    const { error } = await getSupabaseClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName, organization_name: input.organizationName },
        emailRedirectTo: input.emailRedirectTo,
      },
    });
    if (error) throw error;
  },

  async requestPasswordReset(email, redirectTo) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  async exchangeCodeForSession(code) {
    const { error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
    if (error) throw error;
  },

  async updatePassword(password) {
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  },
};
