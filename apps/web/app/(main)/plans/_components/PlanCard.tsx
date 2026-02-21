import Link from "next/link";
import type { PlanListItem } from "@/lib/plans";

interface Props {
  plan: PlanListItem;
}

export function PlanCard({ plan }: Props) {
  const updatedAt = new Date(plan.updatedAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/plans/${plan.id}`}
      className="block rounded-xl border border-white/10 p-4 transition-colors hover:border-white/20 hover:bg-white/5"
    >
      <p className="font-semibold">{plan.name}</p>
      <p className="mt-1 text-sm text-white/50">Обновлён: {updatedAt}</p>
    </Link>
  );
}
