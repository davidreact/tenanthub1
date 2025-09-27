"use client";

import { useAuth } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // This hook handles JWT role setting and auth state management
  useAuth();

  return <>{children}</>;
}