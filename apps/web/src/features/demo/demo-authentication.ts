import type { Authentication, AuthSession } from "@/lib/authentication";

export const demoSession: AuthSession = {
  accessToken: "demo-access-token",
  user: {
    id: "demo-user-alix",
    email: "alix@atelier-nova.demo",
    userMetadata: { full_name: "Alix Martin", organization_name: "Atelier Nova" },
  },
};

export class DemoAuthentication implements Authentication {
  readonly configured = true;
  private session: AuthSession | null = demoSession;
  private readonly listeners = new Set<(session: AuthSession | null) => void>();

  async getSession() {
    return this.session;
  }

  onAuthStateChange(listener: (session: AuthSession | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async signInWithPassword() {
    this.setSession(demoSession);
  }

  async signUp() {}

  async requestPasswordReset() {}

  async exchangeCodeForSession() {
    this.setSession(demoSession);
  }

  async updatePassword() {}

  async signOut() {
    this.setSession(null);
  }

  private setSession(session: AuthSession | null) {
    this.session = session;
    this.listeners.forEach((listener) => listener(session));
  }
}
