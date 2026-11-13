"use client";

import { useLocale, type TranslationKey } from "@/lib/i18n";

export function LocalizedHeading({
  titleKey,
  subtitleKey,
}: {
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
}) {
  const { t } = useLocale();
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <p className="text-sm text-muted-foreground">{t(subtitleKey)}</p>
    </div>
  );
}
