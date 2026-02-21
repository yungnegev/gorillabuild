import { auth } from "@clerk/nextjs/server";
import { getExercises } from "@/lib/exercises";
import { getActiveGoalsWithProgress } from "@/lib/goals";
import { GoalPageClient } from "./_components/GoalPageClient";

export default async function GoalPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [initialGoals, initialExercises] = await Promise.all([
    getActiveGoalsWithProgress(userId),
    getExercises(),
  ]);

  return <GoalPageClient initialGoals={initialGoals} initialExercises={initialExercises} />;
}
