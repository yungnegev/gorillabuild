"use client";

import type { Comparison } from "@gorillabuild/shared/schemas";
import Image from "next/image";
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
import { Loader } from "@/app/_components/Loader";
import type { FriendDetail, FriendExerciseSummary } from "@/lib/friends";

type ChartMode = "absolute" | "ratio";

type Props = {
  friend: FriendDetail;
  initialExercises: FriendExerciseSummary[];
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function getBodyWeightOnOrBefore(
  entries: { date: string; weightKg: number }[],
  dateStr: string,
): number | null {
  const date = dateStr.slice(0, 10);
  const onOrBefore = entries
    .filter((e) => e.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return onOrBefore[0]?.weightKg ?? null;
}

function ComparisonChart({
  data,
  mode,
  myLabel,
  friendLabel,
}: {
  data: Comparison;
  mode: ChartMode;
  myLabel: string;
  friendLabel: string;
}) {
  const myBodyWeights = data.mine.bodyWeights ?? [];
  const friendBodyWeights = data.friend.bodyWeights ?? [];

  const chartData = useMemo(() => {
    const myMap = new Map(
      data.mine.points.map((p) => {
        const dateStr = p.date.slice(0, 10);
        const bw = getBodyWeightOnOrBefore(myBodyWeights, dateStr);
        return [
          dateStr,
          {
            oneRm: Math.round(p.oneRm * 10) / 10,
            ratio: bw != null && bw > 0 ? Math.round((p.oneRm / bw) * 1000) / 1000 : null,
          },
        ];
      }),
    );
    const friendMap = new Map(
      data.friend.points.map((p) => {
        const dateStr = p.date.slice(0, 10);
        const bw = getBodyWeightOnOrBefore(friendBodyWeights, dateStr);
        return [
          dateStr,
          {
            oneRm: Math.round(p.oneRm * 10) / 10,
            ratio: bw != null && bw > 0 ? Math.round((p.oneRm / bw) * 1000) / 1000 : null,
          },
        ];
      }),
    );

    const allDates = [...new Set([...myMap.keys(), ...friendMap.keys()])].sort();
    return allDates.map((date) => ({
      date,
      dateTime: new Date(date).getTime(),
      mine: myMap.get(date)?.oneRm ?? null,
      friend: friendMap.get(date)?.oneRm ?? null,
      myRatio: myMap.get(date)?.ratio ?? null,
      friendRatio: friendMap.get(date)?.ratio ?? null,
    }));
  }, [data, myBodyWeights, friendBodyWeights]);

  const isEmpty = chartData.length === 0;

  if (isEmpty) {
    return (
      <p className="py-4 text-center text-sm text-white/50">
        Нет данных для сравнения — у кого-то ещё не было тренировок с этим упражнением
      </p>
    );
  }

  const hasAnyRatio = chartData.some((d) => d.myRatio != null || d.friendRatio != null);

  if (mode === "ratio" && !hasAnyRatio) {
    return (
      <p className="py-4 text-center text-sm text-white/50">
        Нет записей массы тела — добавь вес в профиле, чтобы видеть относительную силу
      </p>
    );
  }

  const activeDataKey = mode === "ratio" ? { mine: "myRatio", friend: "friendRatio" } : { mine: "mine", friend: "friend" };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-white" />
          {myLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-lime-400" />
          {friendLabel}
        </span>
      </div>

      <div className="h-44 w-full" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={176}>
          <LineChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={(v: number) =>
                mode === "ratio" ? v.toFixed(2) : `${v} кг`
              }
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)" }}
              contentStyle={{
                background: "rgba(9,9,11,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                color: "white",
              }}
              formatter={(value, name) => {
                const label = name === activeDataKey.mine ? myLabel : friendLabel;
                if (typeof value !== "number") return ["—", label];
                return [
                  mode === "ratio" ? value.toFixed(3) : `${value} кг`,
                  label,
                ];
              }}
              labelFormatter={(v) => dateFormatter.format(new Date(v))}
            />
            <Line
              type="monotone"
              dataKey={activeDataKey.mine}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "white" }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey={activeDataKey.friend}
              stroke="#a3e635"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#a3e635" }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ExerciseRow({
  exercise,
  friendshipId,
  mode,
  myLabel,
  friendLabel,
}: {
  exercise: FriendExerciseSummary;
  friendshipId: number;
  mode: ChartMode;
  myLabel: string;
  friendLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (comparison) {
      setExpanded(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/friends/${friendshipId}/exercises/${exercise.id}`);
      if (!res.ok) throw new Error("Не удалось загрузить данные");
      const data: Comparison = await res.json();
      setComparison(data);
      setExpanded(true);
    } catch {
      setError("Не удалось загрузить данные сравнения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-medium">{exercise.name}</span>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden gap-4 sm:flex">
            <span className="text-sm text-white/70">
              Я:{" "}
              <span className="text-white">
                {exercise.myBestOneRm != null ? `${exercise.myBestOneRm} кг` : "—"}
              </span>
            </span>
            <span className="text-sm text-lime-400">
              Друг:{" "}
              <span className="text-lime-300">
                {exercise.friendBestOneRm != null ? `${exercise.friendBestOneRm} кг` : "—"}
              </span>
            </span>
          </div>
          <span className="text-white/40 text-sm">{expanded ? "↑" : "↓"}</span>
        </div>
      </button>

      {/* mobile best 1RM */}
      <div className="flex gap-4 px-4 pb-3 sm:hidden text-sm">
        <span className="text-white/70">
          Я:{" "}
          <span className="text-white">
            {exercise.myBestOneRm != null ? `${exercise.myBestOneRm} кг` : "—"}
          </span>
        </span>
        <span className="text-lime-400">
          Друг:{" "}
          <span className="text-lime-300">
            {exercise.friendBestOneRm != null ? `${exercise.friendBestOneRm} кг` : "—"}
          </span>
        </span>
      </div>

      {loading && (
        <div className="px-4 pb-4">
          <Loader message="Загрузка…" className="flex items-center gap-2 text-sm" />
        </div>
      )}

      {error && (
        <p className="px-4 pb-4 text-sm text-red-400">{error}</p>
      )}

      {expanded && comparison && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <ComparisonChart
            data={comparison}
            mode={mode}
            myLabel={myLabel}
            friendLabel={friendLabel}
          />
        </div>
      )}
    </li>
  );
}

export function FriendDetailClient({ friend, initialExercises }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<ChartMode>("absolute");

  const displayName = friend.name || friend.username || friend.userId;
  const myLabel = "Вы";
  const friendLabel = friend.username ? `@${friend.username}` : (friend.name ?? "Друг");

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-white/60 hover:text-white"
            aria-label="Назад"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Сравнение</h1>
        </div>

        {/* Режим графика */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode("absolute")}
            className={`rounded px-2 py-1 text-sm ${mode === "absolute" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
          >
            absolute
          </button>
          <button
            type="button"
            onClick={() => setMode("ratio")}
            className={`rounded px-2 py-1 text-sm ${mode === "ratio" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
          >
            ratio
          </button>
        </div>
      </div>

      {/* Friend profile */}
      <div className="flex items-center gap-4 rounded-xl border border-white/10 p-4">
        {friend.imageUrl ? (
          <Image
            src={friend.imageUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white"
          >
            {(displayName || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold">{displayName}</p>
          {friend.username && friend.name && (
            <p className="text-sm text-white/50">@{friend.username}</p>
          )}
        </div>
      </div>

      {/* Exercise comparison list */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-white/60">Упражнения</h2>

        {initialExercises.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-center">
            <p className="text-white/50">Нет данных для сравнения</p>
            <p className="mt-1 text-sm text-white/40">
              Нужно завершить хотя бы одну тренировку с упражнениями
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {initialExercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                friendshipId={friend.friendshipId}
                mode={mode}
                myLabel={myLabel}
                friendLabel={friendLabel}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
