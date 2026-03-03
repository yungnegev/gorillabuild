import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { setEntries, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

/** Проверяет ownership set'а через join-chain. Возвращает set или null. */
export async function verifySetOwnership(userId: string, setId: number) {
  const [row] = await db
    .select({ userId: workouts.userId, set: setEntries })
    .from(setEntries)
    .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(setEntries.id, setId))
    .limit(1);

  return row?.userId === userId ? row.set : null;
}

/** Обновляет подход. Проверяет ownership. Возвращает null, если не найден. */
export async function updateSet(
  userId: string,
  setId: number,
  data: { weightKg?: number; reps?: number }
) {
  const existing = await verifySetOwnership(userId, setId);
  if (!existing) return null;

  const [updated] = await db
    .update(setEntries)
    .set(data)
    .where(eq(setEntries.id, setId))
    .returning();

  return { ...updated, oneRm: calcOneRm(updated.weightKg, updated.reps) };
}

/** Удаляет подход. Проверяет ownership. Возвращает false, если не найден. */
export async function deleteSet(userId: string, setId: number): Promise<boolean> {
  const existing = await verifySetOwnership(userId, setId);
  if (!existing) return false;

  await db.delete(setEntries).where(eq(setEntries.id, setId));
  return true;
}

/** Добавляет подход к workoutExercise. Проверяет ownership через workout. Возвращает null, если не найден. */
export async function addSet(
  userId: string,
  workoutExerciseId: number,
  data: { weightKg: number; reps: number }
) {
  // verify ownership via workout
  const [we] = await db
    .select({ userId: workouts.userId })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(workoutExercises.id, workoutExerciseId))
    .limit(1);

  if (!we || we.userId !== userId) return null;

  const [{ currentCount }] = await db
    .select({ currentCount: count() })
    .from(setEntries)
    .where(eq(setEntries.workoutExerciseId, workoutExerciseId));

  const [set] = await db
    .insert(setEntries)
    .values({
      workoutExerciseId,
      order: currentCount + 1,
      weightKg: data.weightKg,
      reps: data.reps,
    })
    .returning();

  return { ...set, oneRm: calcOneRm(set.weightKg, set.reps) };
}
