/* eslint-disable react-refresh/only-export-components -- route modules intentionally combine lazy components and router configuration */
import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "@/features/auth/components/require-auth";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })),
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
  { path: "/", element: <Navigate to="/sign-in" replace /> },
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
  { path: "/auth/callback", element: <Navigate to="/app" replace /> },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <LazyRoute>
          <DashboardPage />
        </LazyRoute>
      </RequireAuth>
    ),
  },
  { path: "*", element: <Navigate to="/sign-in" replace /> },
]);
