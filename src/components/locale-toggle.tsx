"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 px-2"
      aria-label="Toggle language"
      onClick={() => setLocale(locale === "it" ? "en" : "it")}
    >
      <Languages className="size-3.5" />
      <span className="text-xs font-semibold">{t("lang")}</span>
      <span className="text-[10px] text-muted-foreground">/{t("lang_switch")}</span>
    </Button>
  );
}
