import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ToastProvider } from "@flowpilot/ui";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/features/auth/auth-context";
import { ApplicationProvider } from "./application-context";
import { DataTransportProvider } from "./data-transport-context";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: 0 } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <DataTransportProvider>
              <ApplicationProvider>{children}</ApplicationProvider>
            </DataTransportProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
