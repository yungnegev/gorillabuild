import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ planId?: string }>;
};

export default async function WorkoutPage({ searchParams }: Props) {
  const { planId } = await searchParams;
  const query = planId ? `?planId=${planId}` : "";
  redirect(`/workout/active${query}`);
}
