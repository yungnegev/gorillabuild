"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Goal } from "@gorillabuild/shared/schemas";

interface Props {
  goal: Goal;
  onDelete: (id: number) => void;
  onEdit: () => void;
}

export function GoalCard({ goal, onDelete, onEdit }: Props) {
  const t = useTranslations("goals.card");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const unit = tCommon("units.kg");
  const achieved = goal.currentOneRm !== null && goal.currentOneRm >= goal.targetOneRm;
  const progress =
    goal.currentOneRm !== null
      ? Math.min(100, Math.round((goal.currentOneRm / goal.targetOneRm) * 100))
      : 0;

  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{goal.exerciseName}</p>
        <div className="flex gap-2">
          <button
          type="button"
          onClick={onEdit}
          className="text-xs text-white/40 hover:text-white/70"
        >
            {t("editGoal")}
          </button>
          <button
          type="button"
          onClick={() => onDelete(goal.id)}
          className="text-xs text-white/40 hover:text-white/70"
        >
            {t("deleteGoal")}
          </button>
        </div>
      </div>

      {achieved ? (
        <p className="font-medium text-green-400">{t("achieved")}</p>
      ) : (
        <p className="text-sm text-white/70">
          {t("remaining")}{" "}
          <span className="font-medium text-white">
            {goal.remainingKg !== null ? `${goal.remainingKg.toFixed(1)} ${unit}` : t("noData")}
          </span>
        </p>
      )}

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-white/50">{t("current")}</p>
          <p>{goal.currentOneRm !== null ? `${goal.currentOneRm.toFixed(1)} ${unit}` : "—"}</p>
        </div>
        <div>
          <p className="text-white/50">{t("target")}</p>
          <p>{goal.targetOneRm} {unit}</p>
        </div>
        <div>
          <p className="text-white/50">{t("deadline")}</p>
          <p>{new Date(goal.targetDate).toLocaleDateString(locale)}</p>
        </div>
      </div>
    </div>
  );
}
