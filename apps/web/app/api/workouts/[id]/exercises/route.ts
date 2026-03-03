import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addExerciseToWorkout } from "@/lib/workouts";

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

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const we = await addExerciseToWorkout(userId, workoutId, body.data.exerciseId);
  if (!we) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(we, { status: 201 });
}
