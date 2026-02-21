import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";

export const dynamic = "force-dynamic";

/** GET /api/friends/requests — входящие заявки (pending) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(friendships)
    .where(eq(friendships.toUserId, userId));

  const clerk = await clerkClient();

  const requests = await Promise.all(
    rows.map(async (row) => {
      const [dbUser] = await db.select().from(users).where(eq(users.id, row.fromUserId)).limit(1);
      const clerkUser = await clerk.users.getUser(row.fromUserId).catch(() => null);

      return {
        friendshipId: row.id,
        fromUserId: row.fromUserId,
        username: dbUser?.username ?? null,
        name: clerkUser
          ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
          : null,
        createdAt: row.createdAt.toISOString(),
      };
    })
  );

  return NextResponse.json(requests);
}
