"use client";

import { locales } from "@gorillabuild/i18n";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageToggle() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("app.language");

  async function setLocale(nextLocale: string) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 p-1">
      <span className="px-1 text-[11px] text-white/40" aria-hidden>
        {t("label")}
      </span>
      {locales.map((value) => {
        const active = value === locale;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setLocale(value)}
            className={`rounded px-2 py-1 text-[11px] font-semibold uppercase transition-colors ${
              active
                ? "bg-white text-black"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            aria-pressed={active}
            aria-label={t(value)}
          >
            {t(value)}
          </button>
        );
      })}
    </div>
  );
}
