"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Loader } from "@/app/_components/Loader";

type SetEntry = {
  id: number;
  workoutExerciseId: number;
  order: number;
  weightKg: number;
  reps: number;
  oneRm?: number;
};

type WorkoutExercise = {
  id: number;
  workoutId: number;
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: SetEntry[];
};

type ActiveWorkout = {
  id: number;
  userId: string;
  startedAt: string;
  finishedAt: string | null;
  exercises: WorkoutExercise[];
};

type ExerciseOption = {
  id: number;
  name: string;
};

interface Props {
  planId: number | null;
}

export function ActiveWorkoutClient({ planId }: Props) {
  const router = useRouter();
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [exercisesList, setExercisesList] = useState<ExerciseOption[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [addingExerciseId, setAddingExerciseId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureWorkout() {
      let res = await fetch("/api/workouts", { cache: "no-store" });
      let data = await res.json();

      // Нет активной — создаём (из плана или пустую)
      const needNewFromPlan =
        planId != null &&
        res.ok &&
        data &&
        typeof data.id === "number" &&
        Array.isArray(data.exercises) &&
        data.exercises.length === 0;
      if (!cancelled && res.ok && (data == null || needNewFromPlan)) {
        if (needNewFromPlan) {
          await fetch(`/api/workouts/${data.id}`, { method: "PATCH" });
        }
        await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planId != null ? { planId } : {}),
        });
        res = await fetch("/api/workouts", { cache: "no-store" });
        data = await res.json();
      }

      // Ставим в state только валидный объект тренировки (с id и exercises)
      if (!cancelled && res.ok && data && typeof data.id === "number" && Array.isArray(data.exercises)) {
        setWorkout(data);
      }
      if (!cancelled) setLoading(false);
    }

    ensureWorkout();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const refetchWorkout = useCallback(async () => {
    const res = await fetch("/api/workouts", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data && typeof data.id === "number" && Array.isArray(data.exercises)) {
      setWorkout(data);
    }
  }, []);

  useEffect(() => {
    if (!addExerciseOpen) return;
    setExercisesLoading(true);
    fetch("/api/exercises", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setExercisesList(data);
      })
      .finally(() => setExercisesLoading(false));
  }, [addExerciseOpen]);

  async function addExerciseToWorkout(exerciseId: number) {
    if (!workout) return;
    setAddingExerciseId(exerciseId);
    try {
      const res = await fetch(`/api/workouts/${workout.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      if (res.ok) {
        setAddExerciseOpen(false);
        await refetchWorkout();
      }
    } finally {
      setAddingExerciseId(null);
    }
  }

  async function updateSet(setId: number, patch: { weightKg?: number; reps?: number }) {
    if (!workout) return;
    const payload: { weightKg?: number; reps?: number } = {};
    if (patch.weightKg !== undefined && patch.weightKg > 0) payload.weightKg = patch.weightKg;
    if (patch.reps !== undefined && patch.reps > 0) payload.reps = patch.reps;
    if (Object.keys(payload).length === 0) return;
    const res = await fetch(`/api/sets/${setId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updated } : s)),
        })),
      };
    });
  }

  async function addSet(workoutExerciseId: number) {
    const res = await fetch(`/api/workout-exercises/${workoutExerciseId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: 1, reps: 1 }),
    });
    if (!res.ok) return;
    const newSet = await res.json();
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.id === workoutExerciseId
            ? { ...ex, sets: [...ex.sets, newSet].sort((a, b) => a.order - b.order) }
            : ex
        ),
      };
    });
  }

  async function handleFinish() {
    if (!workout) return;
    setFinishing(true);
    const res = await fetch(`/api/workouts/${workout.id}`, { method: "PATCH" });
    if (res.ok) router.push("/plans");
    else setFinishing(false);
  }

  if (loading) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center">
        <Loader message="Загрузка…" inline={false} />
      </section>
    );
  }

  if (!workout) {
    return (
      <section className="space-y-4">
        <p className="text-white/60">Не удалось загрузить тренировку</p>
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-sm text-lime-300 hover:text-lime-200"
        >
          <span aria-hidden>←</span>
          К планам
        </Link>
      </section>
    );
  }

  const isEmpty = workout.exercises.length === 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
            aria-label="К планам"
          >
            <span aria-hidden>←</span>
            Планы
          </Link>
          <h1 className="text-2xl font-bold text-white">Активная тренировка</h1>
        </div>
        <button
          type="button"
          onClick={() => setAddExerciseOpen(true)}
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          + Добавить упражнение
        </button>
      </header>

      {isEmpty && (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 py-12 text-center">
          <p className="text-white/80">Нет упражнений</p>
          <p className="mt-1 text-sm text-white/50">
            Нажмите «Добавить упражнение» и выберите из списка
          </p>
        </div>
      )}

      <ul className="space-y-4">
        {workout.exercises.map((ex) => (
          <li
            key={ex.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <p className="font-semibold">
              <Link
                href={`/exercise/${ex.exerciseId}`}
                className="text-white hover:text-lime-300 focus:outline-none focus:underline"
              >
                {ex.exerciseName}
              </Link>
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[200px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/50">
                    <th className="pb-2 pr-4 font-medium">#</th>
                    <th className="pb-2 pr-3 font-medium">Вес, кг</th>
                    <th className="pb-2 font-medium">Повторы</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((set, idx) => (
                    <tr
                      key={set.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2 pr-4 text-white/60">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={set.weightKg ?? ""}
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value);
                            if (
                              v === null ||
                              (!Number.isNaN(v) && v >= 0)
                            ) {
                              setWorkout((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      exercises: prev.exercises.map((exInner) =>
                                        exInner.id === ex.id
                                          ? {
                                              ...exInner,
                                              sets: exInner.sets.map((s) =>
                                                s.id === set.id
                                                  ? { ...s, weightKg: v ?? 0 }
                                                  : s
                                              ),
                                            }
                                          : exInner
                                      ),
                                    }
                                  : prev
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!Number.isNaN(v) && v > 0)
                              updateSet(set.id, { weightKg: v });
                          }}
                          className="w-16 rounded border border-white/20 bg-white/5 px-2 py-1.5 text-right text-white focus:border-white/40 focus:outline-none"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          value={set.reps ?? ""}
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value, 10);
                            if (
                              v === null ||
                              (!Number.isNaN(v) && v >= 0)
                            ) {
                              setWorkout((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      exercises: prev.exercises.map((exInner) =>
                                        exInner.id === ex.id
                                          ? {
                                              ...exInner,
                                              sets: exInner.sets.map((s) =>
                                                s.id === set.id
                                                  ? { ...s, reps: v ?? 0 }
                                                  : s
                                              ),
                                            }
                                          : exInner
                                      ),
                                    }
                                  : prev
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isNaN(v) && v > 0)
                              updateSet(set.id, { reps: v });
                          }}
                          className="w-14 rounded border border-white/20 bg-white/5 px-2 py-1.5 text-right text-white focus:border-white/40 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => addSet(ex.id)}
              className="mt-3 text-sm text-white/60 hover:text-white"
            >
              + Добавить подход
            </button>
          </li>
        ))}
      </ul>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleFinish}
          disabled={finishing}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 sm:w-auto sm:min-w-[200px] sm:px-6"
        >
          {finishing ? "Завершаем…" : "Завершить тренировку"}
        </button>
      </div>

      {addExerciseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-exercise-title"
          onClick={() => addingExerciseId === null && setAddExerciseOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="add-exercise-title"
              className="text-lg font-semibold text-white"
            >
              Выберите упражнение
            </h2>
            {exercisesLoading ? (
              <p className="mt-4 text-white/60">Загрузка…</p>
            ) : (
              <ul className="mt-4 max-h-64 space-y-1.5 overflow-y-auto">
                {exercisesList.map((ex) => (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => addExerciseToWorkout(ex.id)}
                      disabled={addingExerciseId !== null}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-left text-white hover:bg-white/10 disabled:opacity-50"
                    >
                      {addingExerciseId === ex.id ? "Добавляем…" : ex.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAddExerciseOpen(false)}
                disabled={addingExerciseId !== null}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
