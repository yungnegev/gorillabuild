import type { BodyWeightEntry, OneRmPoint } from "@gorillabuild/shared/schemas";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { bodyWeightEntries, setEntries, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";
import { getExercise } from "@/lib/exercises";
import { getActiveGoalForExercise } from "@/lib/goals";

export type ExerciseDetailData = {
  exercise: { id: number; name: string };
  history: OneRmPoint[];
  bodyWeightEntries: BodyWeightEntry[];
  goal: {
    id: number;
    exerciseId: number;
    exerciseName: string;
    targetOneRm: number;
    targetDate: string;
    currentOneRm: number | null;
    remainingKg: number | null;
  } | null;
};

export async function getExerciseDetailData(
  exerciseId: number,
  userId: string
): Promise<ExerciseDetailData | null> {
  const exercise = await getExercise(exerciseId);
  if (!exercise) return null;

  const rows = await db
    .select({
      workoutId: workouts.id,
      finishedAt: workouts.finishedAt,
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

  const byWorkout = new Map<
    number,
    { date: Date; sets: { weightKg: number; reps: number }[] }
  >();
  for (const row of rows) {
    const date = (row.finishedAt ?? row.startedAt)!;
    const existing = byWorkout.get(row.workoutId);
    if (!existing) {
      byWorkout.set(row.workoutId, { date, sets: [{ weightKg: row.weightKg, reps: row.reps }] });
    } else {
      existing.sets.push({ weightKg: row.weightKg, reps: row.reps });
    }
  }

  const history: OneRmPoint[] = [];
  for (const [workoutId, { date, sets }] of byWorkout) {
    let bestOneRm = 0;
    let bestWeightKg = 0;
    let bestReps = 0;
    for (const s of sets) {
      const oneRm = calcOneRm(s.weightKg, s.reps);
      if (oneRm > bestOneRm) {
        bestOneRm = oneRm;
        bestWeightKg = s.weightKg;
        bestReps = s.reps;
      }
    }
    history.push({
      workoutId,
      date: date.toISOString(),
      oneRm: bestOneRm,
      bestWeightKg,
      bestReps,
    });
  }
  history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const bodyWeightRows = await db
    .select()
    .from(bodyWeightEntries)
    .where(eq(bodyWeightEntries.userId, userId))
    .orderBy(desc(bodyWeightEntries.date));

  const entries: BodyWeightEntry[] = bodyWeightRows.map((r) => ({
    id: r.id,
    userId: r.userId,
    date: r.date,
    weightKg: r.weightKg,
  }));

  const goal = await getActiveGoalForExercise(userId, exerciseId);

  return {
    exercise: { id: exercise.id, name: exercise.name },
    history,
    bodyWeightEntries: entries,
    goal,
  };
}
