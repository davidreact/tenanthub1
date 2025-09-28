"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * @description Provides authentication context by initializing JWT role setting and auth state management for child components.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // This hook handles JWT role setting and auth state management
  useAuth();

  return <>{children}</>;
}