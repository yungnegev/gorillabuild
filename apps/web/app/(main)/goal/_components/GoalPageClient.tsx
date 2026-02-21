"use client";

import { useState } from "react";
import type { Exercise, Goal } from "@gorillabuild/shared/schemas";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";

interface Props {
  initialGoals: Goal[];
  initialExercises: Exercise[];
}

export function GoalPageClient({ initialGoals, initialExercises }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises] = useState<Exercise[]>(initialExercises);
  const [showForm, setShowForm] = useState(false);

  async function loadGoals() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/goal", { cache: "no-store" });
      if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
      setGoals((await res.json()) as Goal[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: {
    exerciseId: number;
    targetOneRm: number;
    targetDate: string;
  }) {
    const res = await fetch("/api/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Ошибка сохранения: ${res.status}`);
    setShowForm(false);
    await loadGoals();
  }

  async function handleDelete(id: number) {
    const snapshot = goals;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      const res = await fetch(`/api/goal/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setGoals(snapshot);
      setError("Не удалось удалить цель");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Цели</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            + Добавить цель
          </button>
        )}
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {showForm && (
        <GoalForm
          exercises={exercises}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          <p className="text-white/70">Загружаем цели...</p>
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div className="rounded-xl border border-white/10 p-6 text-center">
          <p className="text-white/50">Целей пока нет</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Добавить первую цель
          </button>
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
