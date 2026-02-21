"use client";

import { useState } from "react";
import type { Exercise } from "@gorillabuild/shared/schemas";

interface FormData {
  exerciseId: number;
  targetOneRm: number;
  targetDate: string;
}

interface Props {
  exercises: Exercise[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({ exercises, onSubmit, onCancel }: Props) {
  const [exerciseId, setExerciseId] = useState<number | "">("");
  const [targetOneRm, setTargetOneRm] = useState(60);
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (exerciseId === "" || !targetOneRm || !targetDate) {
      setError("Заполни все поля");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({ exerciseId: Number(exerciseId), targetOneRm, targetDate });
    } catch {
      setError("Ошибка сохранения. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="font-medium">Новая цель</p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-1">
        <label htmlFor="exerciseId" className="text-sm text-white/70">
          Упражнение
        </label>
        <select
          id="exerciseId"
          className="w-full rounded-md border border-white/10 bg-transparent p-2"
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Выберите упражнение</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="targetOneRm" className="text-sm text-white/70">
          Целевой 1ПМ (кг)
        </label>
        <input
          id="targetOneRm"
          type="number"
          min={1}
          max={1000}
          step="0.5"
          className="w-full rounded-md border border-white/10 bg-transparent p-2"
          value={targetOneRm}
          onChange={(e) => setTargetOneRm(Number(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="targetDate" className="text-sm text-white/70">
          Дедлайн
        </label>
        <input
          id="targetDate"
          type="date"
          min={today}
          className="w-full rounded-md border border-white/10 bg-transparent p-2"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
        >
          {submitting ? "Сохраняем..." : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-white/50 hover:text-white/80"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
