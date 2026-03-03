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

/** Входные данные для создания/обновления упражнений в плане */
type PlanExerciseInput = {
  exerciseId: number;
  order: number;
  plannedSetCount?: number | null;
};

/** Создаёт план с упражнениями. Возвращает план с упражнениями. */
export async function createPlan(
  userId: string,
  data: { name: string; exercises: PlanExerciseInput[] }
): Promise<PlanWithExercises> {
  const [plan] = await db
    .insert(workoutPlans)
    .values({ userId, name: data.name })
    .returning();

  if (data.exercises.length > 0) {
    await db.insert(planExercises).values(
      data.exercises.map((e) => ({
        planId: plan.id,
        exerciseId: e.exerciseId,
        order: e.order,
        plannedSetCount: e.plannedSetCount ?? null,
      }))
    );
  }

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
    .where(eq(planExercises.planId, plan.id))
    .orderBy(planExercises.order);

  return {
    id: plan.id,
    userId: plan.userId,
    name: plan.name,
    updatedAt: plan.updatedAt.toISOString(),
    exercises: exRows,
  };
}

/** Обновляет имя и/или упражнения плана. Возвращает null, если план не найден. */
export async function updatePlan(
  userId: string,
  planId: number,
  data: { name?: string; exercises?: PlanExerciseInput[] }
): Promise<PlanWithExercises | null> {
  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) return null;

  const now = new Date();

  if (data.name) {
    await db
      .update(workoutPlans)
      .set({ name: data.name, updatedAt: now })
      .where(eq(workoutPlans.id, planId));
  }

  if (data.exercises) {
    await db.delete(planExercises).where(eq(planExercises.planId, planId));
    if (data.exercises.length > 0) {
      await db.insert(planExercises).values(
        data.exercises.map((e) => ({
          planId,
          exerciseId: e.exerciseId,
          order: e.order,
          plannedSetCount: e.plannedSetCount ?? null,
        }))
      );
    }
    await db.update(workoutPlans).set({ updatedAt: now }).where(eq(workoutPlans.id, planId));
  }

  return getPlan(planId, userId);
}

/** Удаляет план и его упражнения. Возвращает false, если план не найден. */
export async function deletePlan(userId: string, planId: number): Promise<boolean> {
  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) return false;

  await db.delete(planExercises).where(eq(planExercises.planId, planId));
  await db.delete(workoutPlans).where(eq(workoutPlans.id, planId));

  return true;
}
