import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPlans, planExercises, exercises } from "@/db/schema";
import { updatePlanSchema } from "@gorillabuild/shared";

async function getPlanWithExercises(planId: number) {
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

  return exRows;
}

/** GET /api/plans/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = Number((await params).id);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exRows = await getPlanWithExercises(planId);

  return NextResponse.json({
    ...plan,
    updatedAt: plan.updatedAt.toISOString(),
    exercises: exRows,
  });
}

/** PATCH /api/plans/[id] — обновляет имя и/или упражнения */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = Number((await params).id);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)))
    .limit(1);

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updatePlanSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const now = new Date();

  if (body.data.name) {
    await db
      .update(workoutPlans)
      .set({ name: body.data.name, updatedAt: now })
      .where(eq(workoutPlans.id, planId));
  }

  if (body.data.exercises) {
    await db.delete(planExercises).where(eq(planExercises.planId, planId));
    if (body.data.exercises.length > 0) {
      await db.insert(planExercises).values(
        body.data.exercises.map((e) => ({
          planId,
          exerciseId: e.exerciseId,
          order: e.order,
          plannedSetCount: e.plannedSetCount ?? null,
        }))
      );
    }
    await db.update(workoutPlans).set({ updatedAt: now }).where(eq(workoutPlans.id, planId));
  }

  const [updated] = await db.select().from(workoutPlans).where(eq(workoutPlans.id, planId));
  const exRows = await getPlanWithExercises(planId);

  return NextResponse.json({
    ...updated,
    updatedAt: updated.updatedAt.toISOString(),
    exercises: exRows,
  });
}

/** DELETE /api/plans/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = Number((await params).id);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db
    .delete(workoutPlans)
    .where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)));

  return NextResponse.json({ ok: true });
}
