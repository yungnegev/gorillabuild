import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFriendDetail } from "@/lib/friends";

export const dynamic = "force-dynamic";

/** GET /api/friends/[id] — профиль друга по friendshipId */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendshipId = Number((await params).id);
  if (isNaN(friendshipId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const detail = await getFriendDetail(userId, friendshipId);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(detail);
}
