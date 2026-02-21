import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";

export const dynamic = "force-dynamic";

/** GET /api/friends — принятые друзья */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      friendshipId: friendships.id,
      fromUserId: friendships.fromUserId,
      toUserId: friendships.toUserId,
    })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.fromUserId, userId), eq(friendships.toUserId, userId))
      )
    );

  const clerk = await clerkClient();

  const friends = await Promise.all(
    rows.map(async (row) => {
      const friendId = row.fromUserId === userId ? row.toUserId : row.fromUserId;
      const [dbUser] = await db.select().from(users).where(eq(users.id, friendId)).limit(1);
      const clerkUser = await clerk.users.getUser(friendId).catch(() => null);

      return {
        friendshipId: row.friendshipId,
        userId: friendId,
        username: dbUser?.username ?? null,
        name: clerkUser ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null : null,
        imageUrl: clerkUser?.imageUrl ?? null,
      };
    })
  );

  return NextResponse.json(friends);
}

const sendRequestSchema = z.object({ handle: z.string().min(1) });

/** POST /api/friends — отправляет запрос дружбы по handle */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = sendRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.username, body.data.handle))
    .limit(1);

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === userId) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  // check duplicate
  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.fromUserId, userId), eq(friendships.toUserId, target.id)),
        and(eq(friendships.fromUserId, target.id), eq(friendships.toUserId, userId))
      )
    )
    .limit(1);

  if (existing) return NextResponse.json({ error: "Request already exists" }, { status: 409 });

  const [friendship] = await db
    .insert(friendships)
    .values({ fromUserId: userId, toUserId: target.id })
    .returning();

  return NextResponse.json(friendship, { status: 201 });
}
