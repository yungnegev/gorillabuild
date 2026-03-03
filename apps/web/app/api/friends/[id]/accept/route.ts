import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { acceptFriendRequest } from "@/lib/friends";

/** PATCH /api/friends/[id]/accept — принимает заявку дружбы */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendshipId = Number((await params).id);
  if (isNaN(friendshipId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const accepted = await acceptFriendRequest(userId, friendshipId);
  if (!accepted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
