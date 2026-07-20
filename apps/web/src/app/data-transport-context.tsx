/* eslint-disable react-refresh/only-export-components -- provider and hook share the transport context */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { apiRequest } from "@/lib/api-client";
import type { DataTransport } from "@/lib/data-transport";
import type { Authentication } from "@/lib/authentication";
import { useAuthentication } from "@/features/auth/auth-context";

export function createHttpDataTransport(authentication: Authentication): DataTransport {
  return {
    async request<T>(path: string, init?: RequestInit, tenant?: Parameters<DataTransport["request"]>[2]) {
      const session = await authentication.getSession();
      return apiRequest<T>(path, init, tenant, session?.accessToken);
    },
  };
}

const DataTransportContext = createContext<DataTransport | null>(null);

export function DataTransportProvider({
  children,
  transport,
}: {
  children: ReactNode;
  transport?: DataTransport;
}) {
  if (transport) {
    return <DataTransportContext.Provider value={transport}>{children}</DataTransportContext.Provider>;
  }
  return <AuthenticatedHttpDataTransportProvider>{children}</AuthenticatedHttpDataTransportProvider>;
}

function AuthenticatedHttpDataTransportProvider({ children }: { children: ReactNode }) {
  const authentication = useAuthentication();
  const httpTransport = useMemo(() => createHttpDataTransport(authentication), [authentication]);
  return <DataTransportContext.Provider value={httpTransport}>{children}</DataTransportContext.Provider>;
}

export function useDataTransport() {
  const context = useContext(DataTransportContext);
  if (!context) throw new Error("useDataTransport doit être utilisé dans DataTransportProvider");
  return context;
}
