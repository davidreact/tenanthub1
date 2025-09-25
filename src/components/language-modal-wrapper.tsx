"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelectionModal } from "./language-selection-modal";
import { getGeolocation, getSuggestedLanguage } from "@/utils/geolocation";
import { Language } from "@/lib/i18n";

export function LanguageModalWrapper() {
  const { language, setLanguage } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [suggestedLanguage, setSuggestedLanguage] = useState<Language>("en");

  useEffect(() => {
    const checkLanguagePreference = async () => {
      // If language is already set, don't show modal
      if (language !== "en" || localStorage.getItem("language") || document.cookie.includes("language=")) {
        return;
      }

      // Check if user is authenticated and has preference in DB
      // But since context already loads it, if language is "en" but no preference, assume new user

      // For simplicity, if language is "en" and no localStorage/cookie, show modal
      // But context sets to "en" by default, so we need to detect if it's new

      // Actually, modify context to have a flag for new user

      // For now, always detect if language is "en" and no stored preference

      const stored = localStorage.getItem("language") || document.cookie.match(/language=([^;]+)/)?.[1];
      if (!stored && language === "en") {
        // Detect geolocation
        const geo = await getGeolocation();
        const suggested = geo ? getSuggestedLanguage(geo.country_code) : "en";
        setSuggestedLanguage(suggested);
        setShowModal(true);
      }
    };

    checkLanguagePreference();
  }, [language]);

  const handleSelectLanguage = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowModal(false);
  };

  return (
    <LanguageSelectionModal
      isOpen={showModal}
      suggestedLanguage={suggestedLanguage}
      onSelectLanguage={handleSelectLanguage}
    />
  );
}