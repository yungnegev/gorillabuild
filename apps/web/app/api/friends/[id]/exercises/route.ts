import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFriendExercises } from "@/lib/friends";

export const dynamic = "force-dynamic";

/**
 * GET /api/friends/[id]/exercises
 * Упражнения, где хотя бы один из двух пользователей имеет данные.
 * Возвращает лучший 1RM каждого.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendshipId = Number((await params).id);
  if (isNaN(friendshipId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const result = await getFriendExercises(userId, friendshipId);
  return NextResponse.json(result);
}
