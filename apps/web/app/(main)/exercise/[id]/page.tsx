import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ExerciseDetailClient } from "@/app/(main)/exercise/[id]/_components/ExerciseDetailClient";
import { getExerciseDetailData } from "@/lib/exercise-detail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExerciseDetailPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;
  const exerciseId = Number(id);
  if (isNaN(exerciseId)) notFound();

  const data = await getExerciseDetailData(exerciseId, userId);
  if (!data) notFound();

  return (
    <ExerciseDetailClient
      exercise={data.exercise}
      history={data.history}
      bodyWeightEntries={data.bodyWeightEntries}
      goal={data.goal}
    />
  );
}
