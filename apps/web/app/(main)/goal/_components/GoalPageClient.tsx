"use client";

import { useState } from "react";
import type { Exercise, Goal } from "@gorillabuild/shared/schemas";
import { Loader } from "@/app/_components/Loader";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";

interface Props {
  initialGoals: Goal[];
  initialExercises: Exercise[];
  initialExerciseId?: number;
}

export function GoalPageClient({
  initialGoals,
  initialExercises,
  initialExerciseId,
}: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises] = useState<Exercise[]>(initialExercises);
  const [showForm, setShowForm] = useState(initialExerciseId != null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

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
    setEditingGoal(null);
    await loadGoals();
  }

  async function handleUpdate(
    goalId: number,
    data: { targetOneRm: number; targetDate: string }
  ) {
    const res = await fetch(`/api/goal/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Ошибка сохранения: ${res.status}`);
    setShowForm(false);
    setEditingGoal(null);
    await loadGoals();
  }

  function handleSubmit(data: {
    exerciseId: number;
    targetOneRm: number;
    targetDate: string;
  }) {
    if (editingGoal) {
      return handleUpdate(editingGoal.id, {
        targetOneRm: data.targetOneRm,
        targetDate: data.targetDate,
      });
    }
    return handleCreate(data);
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
          initialExerciseId={initialExerciseId}
          initialGoal={
            editingGoal
              ? {
                  id: editingGoal.id,
                  exerciseId: editingGoal.exerciseId,
                  targetOneRm: editingGoal.targetOneRm,
                  targetDate: editingGoal.targetDate,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}

      {loading && (
        <div className="rounded-xl border border-white/10 p-3">
          <Loader message="Загружаем цели..." />
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
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDelete}
              onEdit={() => {
                setEditingGoal(goal);
                setShowForm(true);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
