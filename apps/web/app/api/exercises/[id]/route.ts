import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { exercises, setEntries, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

export const dynamic = "force-dynamic";

/**
 * GET /api/exercises/[id]
 * Возвращает упражнение + историю 1RM (max 1RM за тренировку) для текущего пользователя.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = Number((await params).id);
  if (isNaN(exerciseId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select({
      workoutId: workouts.id,
      startedAt: workouts.startedAt,
      weightKg: setEntries.weightKg,
      reps: setEntries.reps,
    })
    .from(setEntries)
    .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workoutExercises.exerciseId, exerciseId),
        eq(workouts.userId, userId),
        isNotNull(workouts.finishedAt)
      )
    );

  // max 1RM per workout
  const byWorkout = new Map<
    number,
    { date: Date; oneRm: number; bestWeightKg: number; bestReps: number }
  >();

  for (const row of rows) {
    const oneRm = calcOneRm(row.weightKg, row.reps);
    const existing = byWorkout.get(row.workoutId);
    if (!existing || oneRm > existing.oneRm) {
      byWorkout.set(row.workoutId, {
        date: row.startedAt,
        oneRm,
        bestWeightKg: row.weightKg,
        bestReps: row.reps,
      });
    }
  }

  const history = [...byWorkout.entries()]
    .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
    .map(([workoutId, v]) => ({
      workoutId,
      date: v.date.toISOString(),
      oneRm: v.oneRm,
      bestWeightKg: v.bestWeightKg,
      bestReps: v.bestReps,
    }));

  return NextResponse.json({ ...exercise, history });
}
