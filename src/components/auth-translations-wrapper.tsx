"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ReactNode } from "react";

interface AuthTranslationsWrapperProps {
  children: (t: (key: any) => string) => ReactNode;
}

export function AuthTranslationsWrapper({ children }: AuthTranslationsWrapperProps) {
  const { t } = useLanguage();
  
  return <>{children(t)}</>;
}
