import type { Exercise } from "@gorillabuild/shared/schemas";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";

export async function getExercises(): Promise<Exercise[]> {
  return db.select().from(exercises).orderBy(exercises.name);
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return rows[0] ?? null;
}
