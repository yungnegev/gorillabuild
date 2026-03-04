"use client";

import { useTranslations } from "next-intl";

interface Props {
  today: string;
  weightKg: string;
  latestWeightKg: number | null;
  submitting: boolean;
  disabled: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onWeightChange: (value: string) => void;
}

export function BodyWeightForm({
  today,
  weightKg,
  latestWeightKg,
  submitting,
  disabled,
  onSubmit,
  onWeightChange,
}: Props) {
  const t = useTranslations("profile.bodyWeightForm");
  const tCommon = useTranslations("common");
  const unit = tCommon("units.kg");

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="font-medium">{t("title")}</p>

      <p className="text-sm text-white/60">{t("entryDateToday", { today })}</p>

      <div className="space-y-1">
        <label htmlFor="weightKg" className="text-sm text-white/70">
          {t("weightLabel", { unit })}
        </label>
        <input
          id="weightKg"
          type="number"
          min={0.1}
          step="0.1"
          className="w-full rounded-md border border-white/10 bg-transparent p-2"
          value={weightKg}
          onChange={(e) => onWeightChange(e.target.value)}
          placeholder={latestWeightKg !== null ? latestWeightKg.toFixed(1) : "70.0"}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || disabled}
        className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
      >
        {submitting ? t("saving") : t("add")}
      </button>
    </form>
  );
}
