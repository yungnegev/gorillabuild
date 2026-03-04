"use client";

import type { BodyWeightEntry } from "@gorillabuild/shared/schemas";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  entries: BodyWeightEntry[];
}

function parseIsoDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function BodyWeightHistory({ entries }: Props) {
  const locale = useLocale();
  const t = useTranslations("profile.history");
  const tCommon = useTranslations("common");
  const unit = tCommon("units.kg");

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-4">
      <p className="font-medium">{t("title")}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-white/60">{t("empty")}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded-md border border-white/10 px-2 py-1.5"
            >
              <span className="text-white/70">{dateFormatter.format(parseIsoDate(entry.date))}</span>
              <span>{entry.weightKg.toFixed(1)} {unit}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
