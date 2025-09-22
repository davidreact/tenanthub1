"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactCountryFlag } from "react-country-flag";
import { languages, Language } from "@/lib/i18n";

interface LanguageSelectionModalProps {
  isOpen: boolean;
  suggestedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
}

const languageFlags = {
  en: "US",
  es: "ES",
  fr: "FR",
};

export function LanguageSelectionModal({
  isOpen,
  suggestedLanguage,
  onSelectLanguage,
}: LanguageSelectionModalProps) {
  const handleSelect = (language: Language) => {
    onSelectLanguage(language);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center">
            Select Your Language
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-center text-muted-foreground">
            Based on your location, we suggest {languages[suggestedLanguage]}. Choose your preferred language:
          </p>

          {/* Language Options in a Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.keys(languages) as Language[]).map((language) => (
              <div
                key={language}
                className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  language === suggestedLanguage
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelect(language)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelect(language);
                  }
                }}
              >
                <ReactCountryFlag
                  countryCode={languageFlags[language]}
                  svg
                  style={{
                    width: '3em',
                    height: '3em',
                    marginBottom: '0.5rem',
                  }}
                  title={`${languages[language]} flag`}
                />
                <span className="text-lg font-medium mb-2">
                  {languages[language]}
                </span>
                {language === suggestedLanguage && (
                  <span className="text-xs text-primary font-medium">
                    Suggested
                  </span>
                )}
                <Button
                  variant={language === suggestedLanguage ? "default" : "outline"}
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(language);
                  }}
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}