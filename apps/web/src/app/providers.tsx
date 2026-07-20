import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ToastProvider } from "@flowpilot/ui";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/features/auth/auth-context";
import { ApplicationProvider } from "./application-context";
import { DataTransportProvider } from "./data-transport-context";
import { supabaseAuthentication } from "@/lib/supabase-authentication";
import { DemoProvider } from "@/features/demo/demo-provider";
import { resolveDemoMode } from "@/features/demo/demo-mode";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: 0 } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const application = resolveDemoMode() ? (
    <DemoProvider>
      <ApplicationProvider>{children}</ApplicationProvider>
    </DemoProvider>
  ) : (
    <AuthProvider authentication={supabaseAuthentication}>
      <DataTransportProvider>
        <ApplicationProvider>{children}</ApplicationProvider>
      </DataTransportProvider>
    </AuthProvider>
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {application}
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
