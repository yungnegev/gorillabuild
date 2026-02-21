import { auth } from "@clerk/nextjs/server";
import { ActiveWorkoutClient } from "../_components/ActiveWorkoutClient";

type Props = {
  searchParams: Promise<{ planId?: string }>;
};

export default async function ActiveWorkoutPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const { planId: planIdStr } = await searchParams;
  const planId =
    planIdStr != null && planIdStr !== ""
      ? Number(planIdStr)
      : null;
  const planIdValid =
    planId !== null && !Number.isNaN(planId) ? planId : null;

  return <ActiveWorkoutClient planId={planIdValid} />;
}
