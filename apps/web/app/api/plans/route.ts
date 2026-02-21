import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPlans, planExercises, exercises } from "@/db/schema";
import { createPlanSchema } from "@gorillabuild/shared";

export const dynamic = "force-dynamic";

/** GET /api/plans — список планов пользователя */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await db
    .select()
    .from(workoutPlans)
    .where(eq(workoutPlans.userId, userId))
    .orderBy(desc(workoutPlans.updatedAt));

  return NextResponse.json(plans);
}

/** POST /api/plans — создаёт новый план */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createPlanSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [plan] = await db
    .insert(workoutPlans)
    .values({ userId, name: body.data.name })
    .returning();

  if (body.data.exercises.length > 0) {
    await db.insert(planExercises).values(
      body.data.exercises.map((e) => ({
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

  return NextResponse.json(
    { ...plan, updatedAt: plan.updatedAt.toISOString(), exercises: exRows },
    { status: 201 }
  );
}
