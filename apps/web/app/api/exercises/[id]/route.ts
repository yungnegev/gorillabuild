import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getExerciseDetailData } from "@/lib/exercise-detail";

export const dynamic = "force-dynamic";

/**
 * GET /api/exercises/[id]
 * Возвращает упражнение + историю 1RM (max 1RM за тренировку) для текущего пользователя.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseId = Number((await params).id);
  if (isNaN(exerciseId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const data = await getExerciseDetailData(exerciseId, userId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...data.exercise, history: data.history });
}
