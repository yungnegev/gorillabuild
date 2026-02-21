"use client";

import type { BodyWeightEntry } from "@gorillabuild/shared/schemas";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  entries: BodyWeightEntry[];
}

function parseIsoDateToUtcTime(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function BodyWeightChart({ entries }: Props) {
  const chartModel = useMemo(() => {
    if (entries.length < 2) return null;

    const sorted = [...entries].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.id - b.id;
    });

    const entriesPerDay = new Map<string, number>();
    for (const entry of sorted) {
      entriesPerDay.set(entry.date, (entriesPerDay.get(entry.date) ?? 0) + 1);
    }

    const seenPerDay = new Map<string, number>();
    const intraDaySpreadMs = 16 * 60 * 60 * 1000;
    const withTime = sorted.map((entry) => {
      const dayTime = parseIsoDateToUtcTime(entry.date);
      const totalForDay = entriesPerDay.get(entry.date) ?? 1;
      const currentIndex = seenPerDay.get(entry.date) ?? 0;
      seenPerDay.set(entry.date, currentIndex + 1);

      const centeredOffset =
        totalForDay === 1
          ? 0
          : ((currentIndex / (totalForDay - 1)) - 0.5) * intraDaySpreadMs;

      return {
        ...entry,
        time: dayTime + centeredOffset,
        dayTime,
      };
    });

    const minTime = withTime[0]?.time ?? 0;
    const maxTime = withTime[withTime.length - 1]?.time ?? 0;
    const timeRange = Math.max(maxTime - minTime, 0);
    const minDayTime = withTime[0]?.dayTime ?? 0;
    const maxDayTime = withTime[withTime.length - 1]?.dayTime ?? 0;
    const dayTimeRange = Math.max(maxDayTime - minDayTime, 0);

    const weights = withTime.map((entry) => entry.weightKg);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const rawRange = maxWeight - minWeight;
    const yPadding = Math.max(1, rawRange * 0.15);
    const yMin = minWeight - yPadding;
    const yMax = maxWeight + yPadding;
    const daysRange = timeRange / (1000 * 60 * 60 * 24);

    return {
      minWeight,
      maxWeight,
      data: withTime.map((entry) => ({
        time: entry.time,
        weightKg: entry.weightKg,
      })),
      domain: [yMin, yMax] as [number, number],
      xTicks: dayTimeRange === 0
        ? [minDayTime]
        : [minDayTime, minDayTime + dayTimeRange / 2, maxDayTime],
      xLabelFormatter: daysRange > 120 ? monthFormatter : dateFormatter,
      tooltipDateFormatter: fullDateFormatter,
    };
  }, [entries]);

  if (!chartModel) return null;

  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">Динамика веса</p>
        <p className="text-white/60">
          {chartModel.minWeight.toFixed(1)}-{chartModel.maxWeight.toFixed(1)} кг
        </p>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartModel.data}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={chartModel.xTicks}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
              tickMargin={8}
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 9 }}
              tickFormatter={(value) => chartModel.xLabelFormatter.format(new Date(value))}
            />
            <YAxis
              type="number"
              domain={chartModel.domain}
              tickCount={3}
              width={30}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 8 }}
              tickFormatter={(value: number) => value.toFixed(1)}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)" }}
              contentStyle={{
                background: "rgba(9,9,11,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                color: "white",
              }}
              formatter={(value) => {
                const numeric = typeof value === "number" ? value : Number(value);
                return Number.isFinite(numeric) ? [`${numeric.toFixed(1)} кг`, "Вес"] : [String(value), "Вес"];
              }}
              labelFormatter={(value) => {
                const numeric = typeof value === "number" ? value : Number(value);
                return Number.isFinite(numeric)
                  ? chartModel.tooltipDateFormatter.format(new Date(numeric))
                  : String(value);
              }}
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "white" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
