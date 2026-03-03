import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFriendExerciseComparison } from "@/lib/friends";

export const dynamic = "force-dynamic";

/**
 * GET /api/friends/[id]/exercises/[exerciseId]
 * Возвращает данные сравнения "я vs друг" по упражнению.
 * [id] — friendshipId
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, exerciseId: exIdStr } = await params;
  const friendshipId = Number(id);
  const exerciseId = Number(exIdStr);

  if (isNaN(friendshipId) || isNaN(exerciseId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await getFriendExerciseComparison(userId, friendshipId, exerciseId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
