import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Authentication, AuthSession } from "@/lib/authentication";
import { AuthProvider, useAuth, useAuthentication } from "./auth-context";

const session: AuthSession = {
  accessToken: "access-token",
  user: { id: "user-a", email: "user@example.com", userMetadata: {} },
};

function createAuthentication(): Authentication {
  return {
    configured: true,
    getSession: vi.fn().mockResolvedValue(session),
    onAuthStateChange: vi.fn().mockReturnValue(vi.fn()),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    requestPasswordReset: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    updatePassword: vi.fn(),
    signOut: vi.fn(),
  };
}

describe("AuthProvider", () => {
  it("expose l’authentification injectée et sa session", async () => {
    const authentication = createAuthentication();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider authentication={authentication}>{children}</AuthProvider>
    );

    const authenticationHook = renderHook(() => useAuthentication(), { wrapper });
    const authHook = renderHook(() => useAuth(), { wrapper });

    expect(authenticationHook.result.current).toBe(authentication);
    await waitFor(() => expect(authHook.result.current.loading).toBe(false));
    expect(authHook.result.current.session).toEqual(session);
    expect(authHook.result.current.user).toEqual(session.user);
  });

  it("n’initialise pas de session lorsque l’adaptateur est désactivé", () => {
    const authentication = { ...createAuthentication(), configured: false };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider authentication={authentication}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toEqual({ loading: false, session: null, user: null });
    expect(authentication.getSession).not.toHaveBeenCalled();
    expect(authentication.onAuthStateChange).not.toHaveBeenCalled();
  });
});
