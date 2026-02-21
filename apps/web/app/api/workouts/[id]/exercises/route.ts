import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { workouts, workoutExercises } from "@/db/schema";

const bodySchema = z.object({
  exerciseId: z.number(),
});

/** POST /api/workouts/[id]/exercises — добавляет упражнение в активную тренировку */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const workoutId = Number(id);
  if (isNaN(workoutId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [{ currentCount }] = await db
    .select({ currentCount: count() })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  const [we] = await db
    .insert(workoutExercises)
    .values({
      workoutId,
      exerciseId: body.data.exerciseId,
      order: currentCount + 1,
    })
    .returning();

  return NextResponse.json(we, { status: 201 });
}
