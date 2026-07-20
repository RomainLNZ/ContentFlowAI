/* eslint-disable react-refresh/only-export-components -- provider and hook share the typed application context */
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { TenantRequest } from "@/lib/data-transport";
import { useAuth } from "@/features/auth/auth-context";
import { useDataTransport } from "./data-transport-context";

export type Me = {
  user: {
    id: string;
    supabaseAuthId: string;
    email: string;
    fullName: string;
    onboardingDone: boolean;
  };
  memberships: Array<{
    role: { key: string; name: string };
    organization: {
      id: string;
      name: string;
      slug: string;
      workspaces: Array<{ id: string; name: string; slug: string; isDefault: boolean }>;
    };
  }>;
};

type ApplicationState = {
  me?: Me;
  loading: boolean;
  tenant?: TenantRequest;
  setTenant: (tenant: TenantRequest) => void;
  refresh: () => Promise<unknown>;
};

const ApplicationContext = createContext<ApplicationState | null>(null);

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const transport = useDataTransport();
  const query = useQuery({
    queryKey: ["me", session?.user.id],
    queryFn: () => transport.request<Me>("/v1/me"),
    enabled: Boolean(session),
  });
  const [selectedTenant, setTenantState] = useState<TenantRequest | undefined>(() => {
    try {
      const saved = localStorage.getItem("flowpilot-tenant");
      return saved ? (JSON.parse(saved) as TenantRequest) : undefined;
    } catch {
      return undefined;
    }
  });
  const tenant = useMemo(() => {
    const candidate = selectedTenant;
    if (!query.data) return candidate;
    const isAllowed = query.data.memberships.some(
      ({ organization }) =>
        organization.id === candidate?.organizationId &&
        organization.workspaces.some(({ id }) => id === candidate.workspaceId),
    );
    if (candidate && isAllowed) {
      return candidate;
    }
    const organization = query.data.memberships[0]?.organization;
    const workspace =
      organization?.workspaces.find(({ isDefault }) => isDefault) ?? organization?.workspaces[0];
    if (organization && workspace) {
      return { organizationId: organization.id, workspaceId: workspace.id };
    }
    return undefined;
  }, [query.data, selectedTenant]);

  const setTenant = (nextTenant: TenantRequest) => {
    localStorage.setItem("flowpilot-tenant", JSON.stringify(nextTenant));
    setTenantState(nextTenant);
  };
  const value = {
    me: query.data,
    loading: query.isLoading,
    tenant,
    setTenant,
    refresh: query.refetch,
  };
  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error("useApplication doit être utilisé dans ApplicationProvider");
  return context;
}
