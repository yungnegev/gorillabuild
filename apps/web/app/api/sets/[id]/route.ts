import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { setEntries, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";
import { updateSetSchema } from "@gorillabuild/shared";

async function ownedSet(setId: number, userId: string) {
  const [row] = await db
    .select({ userId: workouts.userId, set: setEntries })
    .from(setEntries)
    .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(setEntries.id, setId))
    .limit(1);

  return row?.userId === userId ? row.set : null;
}

/** PATCH /api/sets/[id] — обновляет подход */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setId = Number((await params).id);
  if (isNaN(setId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await ownedSet(setId, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updateSetSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(setEntries)
    .set(body.data)
    .where(eq(setEntries.id, setId))
    .returning();

  return NextResponse.json({ ...updated, oneRm: calcOneRm(updated.weightKg, updated.reps) });
}

/** DELETE /api/sets/[id] — удаляет подход */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setId = Number((await params).id);
  if (isNaN(setId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await ownedSet(setId, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(setEntries).where(eq(setEntries.id, setId));

  return NextResponse.json({ ok: true });
}
