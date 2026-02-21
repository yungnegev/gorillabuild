import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  workouts,
  workoutExercises,
  setEntries,
  planExercises,
  exercises,
} from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";
import { startWorkoutSchema } from "@gorillabuild/shared";

export const dynamic = "force-dynamic";

/** GET /api/workouts — возвращает активную тренировку (finishedAt IS NULL) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [active] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), isNull(workouts.finishedAt)))
    .limit(1);

  if (!active) return NextResponse.json(null);

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

  return NextResponse.json({
    ...active,
    startedAt: active.startedAt.toISOString(),
    finishedAt: active.finishedAt?.toISOString() ?? null,
    exercises: exercisesWithSets,
  });
}

/** POST /api/workouts — стартует новую тренировку (пустую или из плана) */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = startWorkoutSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { planId } = body.data;

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

      const count = item.plannedSetCount ?? (lastSets.length || 3);

      for (let i = 0; i < count; i++) {
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

  return NextResponse.json({ id: workout.id }, { status: 201 });
}
