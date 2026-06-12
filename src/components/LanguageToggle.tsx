"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const LOCALES = ["id", "en"] as const;

export function LanguageToggle() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  function setLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className="flex overflow-hidden rounded-full border border-[var(--line)] text-xs font-black"
      role="group"
      aria-label={t("language.label")}
    >
      {LOCALES.map((value) => (
        <button
          key={value}
          className={`px-3 py-1.5 uppercase transition-colors ${
            locale === value ? "bg-[var(--gold)] text-black" : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
          onClick={() => setLocale(value)}
        >
          {t(`language.${value}`)}
        </button>
      ))}
    </div>
  );
}
