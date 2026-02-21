import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";

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
    units: user.units,
    email: clerkUser?.emailAddresses[0]?.emailAddress,
    name: clerkUser?.fullName,
    imageUrl: clerkUser?.imageUrl,
    createdAt: user.createdAt,
  });
}

const updateMeSchema = z.object({
  username: z.string().min(1).optional(),
  units: z.enum(["kg"]).optional(),
});

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = updateMeSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [currentUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (body.data.username !== undefined) {
    if (currentUser?.username != null && currentUser.username !== body.data.username) {
      return NextResponse.json(
        { error: "Ник нельзя изменить после установки" },
        { status: 400 }
      );
    }
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, body.data.username), ne(users.id, userId)))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
  }

  await db.update(users).set(body.data).where(eq(users.id, userId));

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const clerkUser = await currentUser();

  return NextResponse.json({
    id: user.id,
    username: user.username,
    units: user.units,
    email: clerkUser?.emailAddresses[0]?.emailAddress,
    name: clerkUser?.fullName,
    imageUrl: clerkUser?.imageUrl,
    createdAt: user.createdAt,
  });
}
