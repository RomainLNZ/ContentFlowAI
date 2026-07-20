export type AuthUser = {
  id: string;
  email?: string;
  userMetadata: Record<string, unknown>;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type AuthSignUpInput = {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  emailRedirectTo: string;
};

export interface Authentication {
  readonly configured: boolean;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void;
  signInWithPassword(input: { email: string; password: string }): Promise<void>;
  signUp(input: AuthSignUpInput): Promise<void>;
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  exchangeCodeForSession(code: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
}
