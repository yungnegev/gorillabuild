import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPlans, planExercises, exercises } from "@/db/schema";

/** Элемент списка планов: id, имя, дата обновления (для отображения на странице /plans) */
export type PlanListItem = {
  id: number;
  userId: string;
  name: string;
  updatedAt: string;
};

/** Загружает планы пользователя для страницы списка (сначала недавно обновлённые). */
export async function getPlans(userId: string): Promise<PlanListItem[]> {
  const rows = await db
    .select({
      id: workoutPlans.id,
      userId: workoutPlans.userId,
      name: workoutPlans.name,
      updatedAt: workoutPlans.updatedAt,
    })
    .from(workoutPlans)
    .where(eq(workoutPlans.userId, userId))
    .orderBy(desc(workoutPlans.updatedAt));

  return rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/** Упражнение в плане (для экрана детали) */
export type PlanExerciseItem = {
  id: number;
  planId: number;
  exerciseId: number;
  exerciseName: string;
  order: number;
  plannedSetCount: number | null;
};

/** План с упражнениями (для экрана Plan Detail) */
export type PlanWithExercises = {
  id: number;
  userId: string;
  name: string;
  updatedAt: string;
  exercises: PlanExerciseItem[];
};

/** Загружает один план с упражнениями по id. Проверяет userId — возвращает null, если план не найден или чужой. */
export async function getPlan(
  planId: number,
  userId: string
): Promise<PlanWithExercises | null> {
  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) return null;

  const exRows = await db
    .select({
      id: planExercises.id,
      planId: planExercises.planId,
      exerciseId: planExercises.exerciseId,
      exerciseName: exercises.name,
      order: planExercises.order,
      plannedSetCount: planExercises.plannedSetCount,
    })
    .from(planExercises)
    .innerJoin(exercises, eq(planExercises.exerciseId, exercises.id))
    .where(eq(planExercises.planId, planId))
    .orderBy(planExercises.order);

  return {
    id: plan.id,
    userId: plan.userId,
    name: plan.name,
    updatedAt: plan.updatedAt.toISOString(),
    exercises: exRows,
  };
}
