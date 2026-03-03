import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  workouts,
  workoutExercises,
  setEntries,
  planExercises,
  exercises,
} from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

/** Возвращает активную тренировку (finishedAt IS NULL) с упражнениями и подходами, или null. */
export async function getActiveWorkout(userId: string) {
  const [active] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), isNull(workouts.finishedAt)))
    .orderBy(desc(workouts.startedAt))
    .limit(1);

  if (!active) return null;

  const wExercises = await db
    .select({
      id: workoutExercises.id,
      workoutId: workoutExercises.workoutId,
      exerciseId: workoutExercises.exerciseId,
      exerciseName: exercises.name,
      order: workoutExercises.order,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(workoutExercises.workoutId, active.id))
    .orderBy(workoutExercises.order);

  const exercisesWithSets = await Promise.all(
    wExercises.map(async (we) => {
      const rows = await db
        .select()
        .from(setEntries)
        .where(eq(setEntries.workoutExerciseId, we.id))
        .orderBy(setEntries.order);

      return {
        ...we,
        sets: rows.map((s) => ({
          ...s,
          oneRm: calcOneRm(s.weightKg, s.reps),
        })),
      };
    })
  );

  return {
    ...active,
    startedAt: active.startedAt.toISOString(),
    finishedAt: active.finishedAt?.toISOString() ?? null,
    exercises: exercisesWithSets,
  };
}

/** Стартует новую тренировку (пустую или из плана). Возвращает { id }. */
export async function startWorkout(userId: string, planId?: number) {
  await db.insert(users).values({ id: userId }).onConflictDoNothing();

  const [workout] = await db
    .insert(workouts)
    .values({ userId })
    .returning();

  if (planId) {
    const planItems = await db
      .select({
        exerciseId: planExercises.exerciseId,
        order: planExercises.order,
        plannedSetCount: planExercises.plannedSetCount,
      })
      .from(planExercises)
      .where(eq(planExercises.planId, planId))
      .orderBy(planExercises.order);

    for (const item of planItems) {
      const [we] = await db
        .insert(workoutExercises)
        .values({ workoutId: workout.id, exerciseId: item.exerciseId, order: item.order })
        .returning();

      // prefill "как в прошлый раз"
      const lastSets = await db
        .select({ weightKg: setEntries.weightKg, reps: setEntries.reps, order: setEntries.order })
        .from(setEntries)
        .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(
          and(
            eq(workoutExercises.exerciseId, item.exerciseId),
            eq(workouts.userId, userId)
          )
        )
        .orderBy(desc(workouts.startedAt))
        .limit(item.plannedSetCount ?? 3);

      const setCount = item.plannedSetCount ?? (lastSets.length || 3);

      for (let i = 0; i < setCount; i++) {
        const prefill = lastSets[i];
        await db.insert(setEntries).values({
          workoutExerciseId: we.id,
          order: i + 1,
          weightKg: prefill?.weightKg ?? 0,
          reps: prefill?.reps ?? 0,
        });
      }
    }
  }

  return { id: workout.id };
}

/** Завершает тренировку (устанавливает finishedAt). */
export async function finishWorkout(userId: string, workoutId: number) {
  await db
    .update(workouts)
    .set({ finishedAt: new Date() })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}

/** Добавляет упражнение в тренировку. Возвращает null, если тренировка не найдена. */
export async function addExerciseToWorkout(
  userId: string,
  workoutId: number,
  exerciseId: number
) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

  if (!workout) return null;

  const [{ currentCount }] = await db
    .select({ currentCount: count() })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  const [we] = await db
    .insert(workoutExercises)
    .values({
      workoutId,
      exerciseId,
      order: currentCount + 1,
    })
    .returning();

  return we;
}
