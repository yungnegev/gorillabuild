import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bodyWeightEntries } from "@/db/schema";

/** SELECT * ORDER BY date DESC */
export async function getBodyWeightEntries(userId: string) {
  return db
    .select()
    .from(bodyWeightEntries)
    .where(eq(bodyWeightEntries.userId, userId))
    .orderBy(desc(bodyWeightEntries.date));
}

/** INSERT RETURNING */
export async function createBodyWeightEntry(
  userId: string,
  data: { date: string; weightKg: number }
) {
  const [entry] = await db
    .insert(bodyWeightEntries)
    .values({ userId, date: data.date, weightKg: data.weightKg })
    .returning();

  return entry;
}
