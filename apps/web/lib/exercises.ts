import type { Exercise } from "@gorillabuild/shared/schemas";
import { db } from "@/db";
import { exercises } from "@/db/schema";

export async function getExercises(): Promise<Exercise[]> {
  return db.select().from(exercises).orderBy(exercises.name);
}
