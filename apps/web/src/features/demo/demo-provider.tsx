import { useState, type ReactNode } from "react";
import { DataTransportProvider } from "@/app/data-transport-context";
import { AuthProvider } from "@/features/auth/auth-context";
import { DemoAuthentication } from "./demo-authentication";
import { DemoDataTransport } from "./demo-data-transport";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [authentication] = useState(() => new DemoAuthentication());
  const [transport] = useState(() => new DemoDataTransport());

  return (
    <AuthProvider authentication={authentication}>
      <DataTransportProvider transport={transport}>{children}</DataTransportProvider>
    </AuthProvider>
  );
}
