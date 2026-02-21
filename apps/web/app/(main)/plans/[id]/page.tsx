import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getPlan } from "@/lib/plans";
import { getExercises } from "@/lib/exercises";
import { PlanDetailClient } from "@/app/(main)/plans/_components/PlanDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PlanDetailPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;
  const planId = Number(id);
  if (isNaN(planId)) notFound();

  const [plan, allExercises] = await Promise.all([
    getPlan(planId, userId),
    getExercises(),
  ]);
  if (!plan) notFound();

  return <PlanDetailClient plan={plan} allExercises={allExercises} />;
}
