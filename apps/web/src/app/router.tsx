/* eslint-disable react-refresh/only-export-components -- route modules intentionally combine lazy components and router configuration */
import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { RequireOnboardingComplete } from "@/features/onboarding/components/require-onboarding-complete";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })),
);
const LandingPage = lazy(() =>
  import("@/features/marketing/pages/landing-page").then((module) => ({ default: module.LandingPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/pages/forgot-password-page").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const SignInPage = lazy(() =>
  import("@/features/auth/pages/sign-in-page").then((module) => ({ default: module.SignInPage })),
);
const SignUpPage = lazy(() =>
  import("@/features/auth/pages/sign-up-page").then((module) => ({ default: module.SignUpPage })),
);
const AuthCallbackPage = lazy(() =>
  import("@/features/auth/pages/auth-callback-page").then((module) => ({
    default: module.AuthCallbackPage,
  })),
);
const OnboardingPage = lazy(() =>
  import("@/features/onboarding/pages/onboarding-page").then((module) => ({
    default: module.OnboardingPage,
  })),
);
const ContentStudioPage = lazy(() =>
  import("@/features/content/pages/content-studio-page").then((module) => ({
    default: module.ContentStudioPage,
  })),
);
const ContentListPage = lazy(() =>
  import("@/features/content/pages/content-list-page").then((module) => ({
    default: module.ContentListPage,
  })),
);
const ContentEditorPage = lazy(() =>
  import("@/features/content/pages/content-editor-page").then((module) => ({
    default: module.ContentEditorPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/pages/reset-password-page").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#08090c] text-sm text-zinc-500">
          Chargement…
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <LazyRoute>
        <LandingPage />
      </LazyRoute>
    ),
  },
  {
    path: "/sign-in",
    element: (
      <LazyRoute>
        <SignInPage />
      </LazyRoute>
    ),
  },
  {
    path: "/sign-up",
    element: (
      <LazyRoute>
        <SignUpPage />
      </LazyRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <LazyRoute>
        <ForgotPasswordPage />
      </LazyRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <LazyRoute>
        <ResetPasswordPage />
      </LazyRoute>
    ),
  },
  {
    path: "/auth/callback",
    element: (
      <LazyRoute>
        <AuthCallbackPage />
      </LazyRoute>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <RequireAuth>
        <LazyRoute>
          <OnboardingPage />
        </LazyRoute>
      </RequireAuth>
    ),
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <RequireOnboardingComplete>
          <LazyRoute>
            <DashboardPage />
          </LazyRoute>
        </RequireOnboardingComplete>
      </RequireAuth>
    ),
  },
  ...[
    ["/app/create", <ContentStudioPage key="studio" />],
    ["/app/content", <ContentListPage key="list" />],
    ["/app/content/:id", <ContentEditorPage key="editor" />],
  ].map(([path, page]) => ({
    path: path as string,
    element: (
      <RequireAuth>
        <RequireOnboardingComplete>
          <LazyRoute>{page}</LazyRoute>
        </RequireOnboardingComplete>
      </RequireAuth>
    ),
  })),
  { path: "*", element: <Navigate to="/" replace /> },
]);
