"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import type { PlanWithExercises, PlanExerciseItem } from "@/lib/plans";
import type { Exercise } from "@gorillabuild/shared/schemas";

interface Props {
  plan: PlanWithExercises;
  allExercises: Exercise[];
}

type EditItem = {
  id: number;
  exerciseId: number;
  exerciseName: string;
  plannedSetCount: number | null;
};

function toEditItems(exercises: PlanExerciseItem[]): EditItem[] {
  return exercises.map((ex) => ({
    id: ex.id,
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    plannedSetCount: ex.plannedSetCount,
  }));
}

export function PlanDetailClient({ plan, allExercises }: Props) {
  const router = useRouter();
  const [name, setName] = useState(plan.name);
  const [items, setItems] = useState<EditItem[]>(() => toEditItems(plan.exercises));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const availableToAdd = useMemo(
    () => allExercises.filter((e) => !items.some((i) => i.exerciseId === e.id)),
    [allExercises, items]
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || plan.name,
          exercises: items.map((item, order) => ({
            exerciseId: item.exerciseId,
            order,
            plannedSetCount: item.plannedSetCount ?? undefined,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `Ошибка ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  function addExercise(exerciseId: number) {
    const ex = allExercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    setItems((prev) => [
      ...prev,
      { id: -ex.id, exerciseId: ex.id, exerciseName: ex.name, plannedSetCount: null },
    ]);
  }

  function removeAt(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function setPlannedSetCount(index: number, value: number | null) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, plannedSetCount: value } : item
      )
    );
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Ошибка ${res.status}`);
      }
      router.push("/plans");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить план");
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/plans"
            className="text-white/60 hover:text-white"
            aria-label="Назад к списку планов"
          >
            ←
          </Link>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-2xl font-bold text-white focus:border-white/40 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
          <Link
            href={`/workout/active?planId=${plan.id}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Start plan
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-white/60">Упражнения</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-white/10 p-4 text-white/50">
            В плане пока нет упражнений. Добавьте из списка ниже.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 px-4 py-3"
              >
                <Link
                  href={`/exercise/${item.exerciseId}`}
                  className="flex-1 font-medium text-white hover:text-white/80 focus:outline-none focus:underline"
                >
                  {item.exerciseName}
                </Link>
                <label className="flex items-center gap-1.5 text-sm text-white/70">
                  Подходов:
                  <input
                    type="number"
                    min={1}
                    value={item.plannedSetCount ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPlannedSetCount(index, v === "" ? null : Math.max(1, parseInt(v, 10) || 0));
                    }}
                    className="w-14 rounded border border-white/20 bg-white/5 px-2 py-1 text-right focus:border-white/40 focus:outline-none"
                    placeholder="—"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="rounded px-2 py-1 text-sm text-red-400 hover:bg-white/10"
                  aria-label="Удалить упражнение"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {availableToAdd.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-sm text-white/60">Добавить:</label>
            <select
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) addExercise(id);
                e.target.value = "";
              }}
              className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm focus:border-white/40 focus:outline-none"
            >
              <option value="">— выбрать —</option>
              {availableToAdd.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-6">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-white/50 hover:text-red-400"
          >
            Удалить план
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/60">Удалить план безвозвратно?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleting ? "Удаляем…" : "Да, удалить"}
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); setError(null); }}
              disabled={deleting}
              className="text-sm text-white/60 hover:text-white disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
