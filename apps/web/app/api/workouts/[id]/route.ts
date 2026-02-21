import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

/** PATCH /api/workouts/[id] — завершает тренировку */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const workoutId = Number(id);
  if (isNaN(workoutId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db
    .update(workouts)
    .set({ finishedAt: new Date() })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  return NextResponse.json({ ok: true });
}
