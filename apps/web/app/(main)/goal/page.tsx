import { auth } from "@clerk/nextjs/server";
import { getExercises } from "@/lib/exercises";
import { getActiveGoalsWithProgress } from "@/lib/goals";
import { GoalPageClient } from "./_components/GoalPageClient";

type Props = {
  searchParams: Promise<{ exerciseId?: string }>;
};

export default async function GoalPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const params = await searchParams;
  const exerciseIdParam = params.exerciseId;
  const initialExerciseId =
    exerciseIdParam != null ? Number(exerciseIdParam) : undefined;
  const validInitialExerciseId =
    typeof initialExerciseId === "number" &&
    !Number.isNaN(initialExerciseId) &&
    initialExerciseId > 0
      ? initialExerciseId
      : undefined;

  const [initialGoals, initialExercises] = await Promise.all([
    getActiveGoalsWithProgress(userId),
    getExercises(),
  ]);

  return (
    <GoalPageClient
      initialGoals={initialGoals}
      initialExercises={initialExercises}
      initialExerciseId={validInitialExerciseId}
    />
  );
}
