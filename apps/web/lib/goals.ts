import type { CreateGoal, Goal } from "@gorillabuild/shared/schemas";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { exercises, goals, setEntries, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

export async function getActiveGoalsWithProgress(userId: string): Promise<Goal[]> {
  const rows = await db
    .select({
      id: goals.id,
      userId: goals.userId,
      exerciseId: goals.exerciseId,
      exerciseName: exercises.name,
      targetOneRm: goals.targetOneRm,
      targetDate: goals.targetDate,
      isActive: goals.isActive,
      createdAt: goals.createdAt,
    })
    .from(goals)
    .innerJoin(exercises, eq(goals.exerciseId, exercises.id))
    .where(and(eq(goals.userId, userId), eq(goals.isActive, true)));

  if (rows.length === 0) return [];

  const exerciseIds = [...new Set(rows.map((row) => row.exerciseId))];

  const allSets = await db
    .select({
      exerciseId: workoutExercises.exerciseId,
      weightKg: setEntries.weightKg,
      reps: setEntries.reps,
    })
    .from(setEntries)
    .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        inArray(workoutExercises.exerciseId, exerciseIds),
        eq(workouts.userId, userId),
        isNotNull(workouts.finishedAt)
      )
    );

  const oneRmByExercise = new Map<number, number>();
  for (const set of allSets) {
    const oneRm = calcOneRm(set.weightKg, set.reps);
    const best = oneRmByExercise.get(set.exerciseId) ?? 0;
    if (oneRm > best) oneRmByExercise.set(set.exerciseId, oneRm);
  }

  return rows.map((goal) => {
    const currentOneRm = oneRmByExercise.get(goal.exerciseId) ?? null;
    return {
      ...goal,
      createdAt: goal.createdAt.toISOString(),
      currentOneRm,
      remainingKg: currentOneRm !== null ? Math.max(0, goal.targetOneRm - currentOneRm) : null,
    };
  });
}

export async function createGoal(userId: string, data: CreateGoal) {
  await db
    .update(goals)
    .set({ isActive: false })
    .where(
      and(
        eq(goals.userId, userId),
        eq(goals.exerciseId, data.exerciseId),
        eq(goals.isActive, true)
      )
    );

  const [goal] = await db
    .insert(goals)
    .values({
      userId,
      exerciseId: data.exerciseId,
      targetOneRm: data.targetOneRm,
      targetDate: data.targetDate,
    })
    .returning();

  return { ...goal, createdAt: goal.createdAt.toISOString() };
}

export async function deactivateGoalById(userId: string, goalId: number): Promise<boolean> {
  const result = await db
    .update(goals)
    .set({ isActive: false })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning({ id: goals.id });

  return result.length > 0;
}

export async function updateGoal(
  userId: string,
  goalId: number,
  data: { targetOneRm: number; targetDate: string }
): Promise<boolean> {
  const result = await db
    .update(goals)
    .set({
      targetOneRm: data.targetOneRm,
      targetDate: data.targetDate,
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId), eq(goals.isActive, true)))
    .returning({ id: goals.id });

  return result.length > 0;
}

/** Активная цель по одному упражнению с currentOneRm и remainingKg, или null */
export async function getActiveGoalForExercise(
  userId: string,
  exerciseId: number
): Promise<{
  id: number;
  exerciseId: number;
  exerciseName: string;
  targetOneRm: number;
  targetDate: string;
  currentOneRm: number | null;
  remainingKg: number | null;
} | null> {
  const goalsWithProgress = await getActiveGoalsWithProgress(userId);
  const goal = goalsWithProgress.find((g) => g.exerciseId === exerciseId) ?? null;
  return goal
    ? {
        id: goal.id,
        exerciseId: goal.exerciseId,
        exerciseName: goal.exerciseName,
        targetOneRm: goal.targetOneRm,
        targetDate: goal.targetDate,
        currentOneRm: goal.currentOneRm ?? null,
        remainingKg: goal.remainingKg ?? null,
      }
    : null;
}
