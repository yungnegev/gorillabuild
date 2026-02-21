import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { friendships } from "@/db/schema";

/** PATCH /api/friends/[id]/accept — принимает заявку дружбы */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendshipId = Number((await params).id);
  if (isNaN(friendshipId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [row] = await db
    .select()
    .from(friendships)
    .where(
      and(eq(friendships.id, friendshipId), eq(friendships.toUserId, userId))
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(eq(friendships.id, friendshipId));

  return NextResponse.json({ ok: true });
}
