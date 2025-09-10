"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, getTranslation, TranslationKey } from "@/lib/i18n";
import { createClient } from "../../supabase/client";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const supabase = createClient();

  useEffect(() => {
    // Load user's language preference
    const loadLanguagePreference = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("language")
          .eq("user_id", user.id)
          .single();

        if (preferences?.language) {
          setLanguageState(preferences.language as Language);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedLanguage = localStorage.getItem("language") as Language;
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }
      }
    };

    loadLanguagePreference();
  }, [supabase]);

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Save to database for authenticated users
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          language: newLanguage,
        },
        {
          onConflict: "user_id",
        },
      );
    } else {
      // Save to localStorage for non-authenticated users
      localStorage.setItem("language", newLanguage);
    }
  };

  const t = (key: TranslationKey) => getTranslation(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
