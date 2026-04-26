"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  ReactNode,
} from "react";
import { Language, translations, type Translations } from "./translations";
import { extendedTranslations, type ExtendedTranslations } from "./extended-translations";

export type AppTranslations = Translations & ExtendedTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: AppTranslations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Apply saved language before paint to avoid mixed-language UI (e.g. RU chips + UZ header).
  useLayoutEffect(() => {
    const saved = localStorage.getItem("zinvest-language") as Language | null;
    if (saved === "en" || saved === "ru" || saved === "uz") {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("zinvest-language", lang);
  };

  const t = { ...translations[language], ...extendedTranslations[language] } as AppTranslations;

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
