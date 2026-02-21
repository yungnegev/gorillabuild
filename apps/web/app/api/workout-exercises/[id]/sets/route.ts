import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutExercises, workouts, setEntries } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";
import { createSetSchema } from "@gorillabuild/shared";

/** POST /api/workout-exercises/[id]/sets — добавляет подход */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const weId = Number(id);
  if (isNaN(weId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // verify ownership via workout
  const [we] = await db
    .select({ userId: workouts.userId })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(workoutExercises.id, weId))
    .limit(1);

  if (!we || we.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = createSetSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [{ currentCount }] = await db
    .select({ currentCount: count() })
    .from(setEntries)
    .where(eq(setEntries.workoutExerciseId, weId));

  const [set] = await db
    .insert(setEntries)
    .values({
      workoutExerciseId: weId,
      order: currentCount + 1,
      weightKg: body.data.weightKg,
      reps: body.data.reps,
    })
    .returning();

  return NextResponse.json(
    { ...set, oneRm: calcOneRm(set.weightKg, set.reps) },
    { status: 201 }
  );
}
