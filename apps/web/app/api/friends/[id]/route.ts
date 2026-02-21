import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";

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

  const [friendship] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        eq(friendships.status, "accepted"),
        or(eq(friendships.fromUserId, userId), eq(friendships.toUserId, userId)),
      ),
    )
    .limit(1);

  if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const friendId =
    friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;

  const [dbUser] = await db.select().from(users).where(eq(users.id, friendId)).limit(1);
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(friendId).catch(() => null);

  return NextResponse.json({
    friendshipId,
    userId: friendId,
    username: dbUser?.username ?? null,
    name: clerkUser
      ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
      : null,
    imageUrl: clerkUser?.imageUrl ?? null,
  });
}
