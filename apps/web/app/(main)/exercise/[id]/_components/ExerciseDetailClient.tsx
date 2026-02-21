"use client";

import type { BodyWeightEntry, OneRmPoint } from "@gorillabuild/shared/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartMode = "absolute" | "ratio";

type Props = {
  exercise: { id: number; name: string };
  history: OneRmPoint[];
  bodyWeightEntries: BodyWeightEntry[];
  goal: {
    id: number;
    exerciseId: number;
    exerciseName: string;
    targetOneRm: number;
    targetDate: string;
    currentOneRm: number | null;
    remainingKg: number | null;
  } | null;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/** Последняя запись массы тела на дату или раньше */
function getBodyWeightOnOrBefore(entries: BodyWeightEntry[], dateStr: string): number | null {
  const date = dateStr.slice(0, 10);
  const onOrBefore = entries.filter((e) => e.date <= date).sort((a, b) => b.date.localeCompare(a.date));
  return onOrBefore[0]?.weightKg ?? null;
}

export function ExerciseDetailClient({
  exercise,
  history,
  bodyWeightEntries,
  goal,
}: Props) {
  const router = useRouter();
  const [chartMode, setChartMode] = useState<ChartMode>("absolute");
  const hasBodyWeight = bodyWeightEntries.length > 0;

  const chartData = useMemo(() => {
    return history.map((point) => {
      const dateStr = point.date.slice(0, 10);
      const bw = getBodyWeightOnOrBefore(bodyWeightEntries, point.date);
      return {
        date: dateStr,
        dateTime: new Date(point.date).getTime(),
        oneRm: Math.round(point.oneRm * 10) / 10,
        ratio: bw != null && bw > 0 ? Math.round((point.oneRm / bw) * 1000) / 1000 : null,
      };
    });
  }, [history, bodyWeightEntries]);

  const ratioData = useMemo(() => chartData.filter((d) => d.ratio != null), [chartData]);

  const goalProgress =
    goal?.currentOneRm != null && goal.targetOneRm > 0
      ? Math.min(100, Math.round((goal.currentOneRm / goal.targetOneRm) * 100))
      : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-white/60 hover:text-white"
          aria-label="Назад"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
      </div>

      {/* График 1RM */}
      {history.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-4 text-center text-white/60">
          Нет завершённых тренировок с этим упражнением — график появится после первых результатов.
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">1RM</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChartMode("absolute")}
                className={`rounded px-2 py-1 text-sm ${chartMode === "absolute" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
              >
                absolute
              </button>
              {hasBodyWeight ? (
                <button
                  type="button"
                  onClick={() => setChartMode("ratio")}
                  className={`rounded px-2 py-1 text-sm ${chartMode === "ratio" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
                >
                  ratio
                </button>
              ) : (
                <Link
                  href="/profile"
                  className="text-sm text-white/50 underline hover:text-white/70"
                >
                  добавь массу тела
                </Link>
              )}
            </div>
          </div>

          <div className="h-44 min-h-[176px] w-full" style={{ minWidth: 0 }}>
            {chartMode === "absolute" && (
              <ResponsiveContainer width="100%" height={176}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="dateTime"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    tickMargin={8}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 9 }}
                    tickFormatter={(v) => dateFormatter.format(new Date(v))}
                  />
                  <YAxis
                    type="number"
                    domain={["auto", "auto"]}
                    tickCount={4}
                    width={36}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 8 }}
                    tickFormatter={(v: number) => `${v} кг`}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                    contentStyle={{
                      background: "rgba(9,9,11,0.9)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    formatter={(value: number | undefined) =>
                      [value != null ? `${value} кг` : "—", "1RM"]
                    }
                    labelFormatter={(v) => dateFormatter.format(new Date(v))}
                  />
                  <Line
                    type="monotone"
                    dataKey="oneRm"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "white" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {chartMode === "ratio" && ratioData.length > 0 && (
              <ResponsiveContainer width="100%" height={176}>
                <LineChart
                  data={ratioData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="dateTime"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    tickMargin={8}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 9 }}
                    tickFormatter={(v) => dateFormatter.format(new Date(v))}
                  />
                  <YAxis
                    type="number"
                    domain={["auto", "auto"]}
                    tickCount={4}
                    width={36}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 8 }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                    contentStyle={{
                      background: "rgba(9,9,11,0.9)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    formatter={(value: number | undefined) =>
                      [value != null ? value.toFixed(3) : "—", "1RM/вес"]
                    }
                    labelFormatter={(v) => dateFormatter.format(new Date(v))}
                  />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "white" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {chartMode === "ratio" && ratioData.length === 0 && hasBodyWeight && (
              <p className="flex h-full items-center justify-center text-sm text-white/50">
                Нет записей массы тела на даты тренировок — добавь вес в профиле
              </p>
            )}
          </div>
        </div>
      )}

      {/* История тренировок */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">История</p>
          <ul className="space-y-2">
            {[...history].reverse().map((point) => (
              <li
                key={point.workoutId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <span className="text-white/70">
                  {dateFormatter.format(new Date(point.date))}
                </span>
                <span className="text-white/90">
                  {point.bestWeightKg} кг × {point.bestReps} → 1RM {point.oneRm.toFixed(1)} кг
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Цель по упражнению */}
      <div className="space-y-2">
        {goal ? (
          <div className="space-y-3 rounded-xl border border-white/10 p-4">
            <p className="font-medium">Цель</p>
            <p className="text-sm text-white/70">
              Целевой 1RM {goal.targetOneRm} кг до{" "}
              {new Date(goal.targetDate).toLocaleDateString("ru-RU")}
            </p>
            <p className="text-sm text-white/70">
              Текущий 1RM:{" "}
              {goal.currentOneRm != null ? `${goal.currentOneRm.toFixed(1)} кг` : "—"}
              {goal.remainingKg != null && goal.remainingKg > 0 && (
                <> · осталось {goal.remainingKg.toFixed(1)} кг</>
              )}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <Link
              href="/goal"
              className="inline-block text-sm text-white/70 underline hover:text-white"
            >
              Изменить цель
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 p-4">
            <p className="mb-2 text-sm text-white/70">Нет цели по этому упражнению</p>
            <Link
              href={`/goal?exerciseId=${exercise.id}`}
              className="text-sm text-white underline hover:text-white/80"
            >
              Поставить цель
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
