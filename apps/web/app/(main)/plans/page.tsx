import { auth } from "@clerk/nextjs/server";
import { getPlans } from "@/lib/plans";
import { PlansPageClient } from "./_components/PlansPageClient";

export default async function PlansPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const initialPlans = await getPlans(userId);

  return <PlansPageClient initialPlans={initialPlans} />;
}
