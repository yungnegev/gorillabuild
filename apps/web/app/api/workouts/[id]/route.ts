import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { finishWorkout } from "@/lib/workouts";

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

  await finishWorkout(userId, workoutId);

  return NextResponse.json({ ok: true });
}
