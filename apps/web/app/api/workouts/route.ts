import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { startWorkoutSchema } from "@gorillabuild/shared";
import { getActiveWorkout, startWorkout } from "@/lib/workouts";

export const dynamic = "force-dynamic";

/** GET /api/workouts — возвращает активную тренировку (finishedAt IS NULL) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workout = await getActiveWorkout(userId);
  return NextResponse.json(workout);
}

/** POST /api/workouts — стартует новую тренировку (пустую или из плана) */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = startWorkoutSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const result = await startWorkout(userId, body.data.planId);
  return NextResponse.json(result, { status: 201 });
}
