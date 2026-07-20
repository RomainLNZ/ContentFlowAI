/* eslint-disable react-refresh/only-export-components -- provider and hook share the transport context */
import { createContext, useContext, type ReactNode } from "react";
import { apiRequest } from "@/lib/api-client";
import type { DataTransport } from "@/lib/data-transport";

export const httpDataTransport: DataTransport = {
  request: apiRequest,
};

const DataTransportContext = createContext<DataTransport | null>(null);

export function DataTransportProvider({
  children,
  transport = httpDataTransport,
}: {
  children: ReactNode;
  transport?: DataTransport;
}) {
  return <DataTransportContext.Provider value={transport}>{children}</DataTransportContext.Provider>;
}

export function useDataTransport() {
  const context = useContext(DataTransportContext);
  if (!context) throw new Error("useDataTransport doit être utilisé dans DataTransportProvider");
  return context;
}
