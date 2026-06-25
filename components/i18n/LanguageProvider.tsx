"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageMeta,
  isLanguage,
  translate,
  translateList,
  type Direction,
  type Language,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  locale: string;
  dir: Direction;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  list: (key: string) => string[];
};

const fallbackMeta = getLanguageMeta(DEFAULT_LANGUAGE);
const fallbackContext: LanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  locale: fallbackMeta.locale,
  dir: fallbackMeta.dir,
  setLanguage: () => {},
  t: (key) => translate(DEFAULT_LANGUAGE, key),
  list: (key) => translateList(DEFAULT_LANGUAGE, key),
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const preferred = navigator.language.toLowerCase();
  if (preferred.startsWith("sv")) return "sv";
  if (preferred.startsWith("ar")) return "ar";
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      setLanguageState(isLanguage(saved) ? saved : detectBrowserLanguage());
    } catch {
      setLanguageState(detectBrowserLanguage());
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      /* localStorage can be unavailable in private browsing */
    }
  }, []);

  const meta = getLanguageMeta(language);

  useEffect(() => {
    // Set the document language for a11y/SEO, but DO NOT mirror the layout for
    // Arabic — Mouaz wants switching language to change the words only, never
    // flip the page. Keep direction LTR; Arabic text still renders right-to-left
    // within its own runs via the browser's natural Unicode bidi.
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    document.documentElement.dataset.language = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: meta.locale,
      // Layout stays LTR for every language (no page mirroring).
      dir: "ltr",
      setLanguage,
      t: (key) => translate(language, key),
      list: (key) => translateList(language, key),
    }),
    [language, meta.locale, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext) ?? fallbackContext;
}
