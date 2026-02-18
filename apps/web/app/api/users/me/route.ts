import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Lazy-create the user row if webhook hasn't fired yet
  await db.insert(users).values({ id: userId }).onConflictDoNothing();

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const clerkUser = await currentUser();

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: clerkUser?.emailAddresses[0]?.emailAddress,
    name: clerkUser?.fullName,
    imageUrl: clerkUser?.imageUrl,
    createdAt: user.createdAt,
  });
}
