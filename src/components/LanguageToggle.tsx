"use client";

import { useTranslations } from "next-intl";

export function LanguageToggle() {
  const t = useTranslations();

  return (
    <div
      className="flex overflow-hidden rounded-full border border-[var(--line)] text-xs font-black"
      role="group"
      aria-label={t("language.label")}
    >
      <span className="bg-[var(--gold)] px-3 py-1.5 uppercase text-black">{t("language.en")}</span>
    </div>
  );
}
