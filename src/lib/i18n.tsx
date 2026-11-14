"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "it" | "en";

const DICT = {
  it: {
    brand: "HelpDesk Lab",
    nav_dashboard: "Dashboard",
    nav_board: "Board",
    nav_lab: "Compiti Lab",
    nav_roadmap: "Roadmap",
    nav_guide: "Guida",
    nav_rank: "Classifica",
    nav_new_ticket: "Nuovo ticket",
    nav_review: "Revisioni",
    nav_notifications: "Notifiche",
    board_title: "Help Desk Board",
    board_subtitle:
      "Tutti i lavori sono qui: ticket e attività. Trascina le card, apri il dettaglio per chiuderle.",
    lab_title: "Compiti Lab",
    lab_subtitle:
      "Esercizi assegnati dal docente: svolgi il mini-game e consegna raggiungendo il punteggio minimo.",
    lang: "IT",
    lang_switch: "EN",
  },
  en: {
    brand: "HelpDesk Lab",
    nav_dashboard: "Dashboard",
    nav_board: "Board",
    nav_lab: "Lab Tasks",
    nav_roadmap: "Roadmap",
    nav_guide: "Guide",
    nav_rank: "Ranking",
    nav_new_ticket: "New ticket",
    nav_review: "Reviews",
    nav_notifications: "Alerts",
    board_title: "Help Desk Board",
    board_subtitle:
      "Every job is on this board: tickets and tasks. Drag cards and open them to close the work.",
    lab_title: "Lab Tasks",
    lab_subtitle:
      "Teacher-assigned exercises: play the mini-game and submit by reaching the minimum score.",
    lang: "EN",
    lang_switch: "IT",
  },
} as const;

export type TranslationKey = keyof typeof DICT.it;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");

  useEffect(() => {
    const saved = window.localStorage.getItem("hdl-locale");
    if (saved === "it" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("hdl-locale", next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => DICT[locale][key] || DICT.it[key],
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
