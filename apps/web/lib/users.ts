import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/** INSERT ON CONFLICT DO NOTHING — lazy-create user row. */
export async function ensureUser(userId: string) {
  await db.insert(users).values({ id: userId }).onConflictDoNothing();
}

/** SELECT * WHERE id = userId. Returns the user or null. */
export async function getUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
}

/** Результат updateUser */
export type UpdateUserResult =
  | { ok: true; user: typeof users.$inferSelect }
  | { ok: false; error: string; status: number };

/** Updates user profile. Checks username immutability & uniqueness. */
export async function updateUser(
  userId: string,
  data: { username?: string; units?: "kg" }
): Promise<UpdateUserResult> {
  const [existingUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (data.username !== undefined) {
    if (existingUser?.username != null && existingUser.username !== data.username) {
      return { ok: false, error: "Ник нельзя изменить после установки", status: 400 };
    }
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, data.username), ne(users.id, userId)))
      .limit(1);
    if (existing) {
      return { ok: false, error: "Username already taken", status: 409 };
    }
  }

  await db.update(users).set(data).where(eq(users.id, userId));

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return { ok: true, user };
}
