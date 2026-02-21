import type { Goal } from "@gorillabuild/shared/schemas";

interface Props {
  goal: Goal;
  onDelete: (id: number) => void;
}

export function GoalCard({ goal, onDelete }: Props) {
  const achieved = goal.currentOneRm !== null && goal.currentOneRm >= goal.targetOneRm;
  const progress =
    goal.currentOneRm !== null
      ? Math.min(100, Math.round((goal.currentOneRm / goal.targetOneRm) * 100))
      : 0;

  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{goal.exerciseName}</p>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-xs text-white/40 hover:text-white/70"
        >
          Удалить
        </button>
      </div>

      {achieved ? (
        <p className="font-medium text-green-400">✓ Достигнуто!</p>
      ) : (
        <p className="text-sm text-white/70">
          Осталось:{" "}
          <span className="font-medium text-white">
            {goal.remainingKg !== null ? `${goal.remainingKg.toFixed(1)} кг` : "нет данных"}
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
          <p className="text-white/50">Текущий</p>
          <p>{goal.currentOneRm !== null ? `${goal.currentOneRm.toFixed(1)} кг` : "—"}</p>
        </div>
        <div>
          <p className="text-white/50">Цель</p>
          <p>{goal.targetOneRm} кг</p>
        </div>
        <div>
          <p className="text-white/50">Дедлайн</p>
          <p>{new Date(goal.targetDate).toLocaleDateString("ru-RU")}</p>
        </div>
      </div>
    </div>
  );
}
