"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { PlanListItem } from "@/lib/plans";

interface Props {
  plan: PlanListItem;
}

export function PlanCard({ plan }: Props) {
  const locale = useLocale();
  const t = useTranslations("plans.card");

  const updatedAt = new Date(plan.updatedAt).toLocaleDateString(locale, {
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
      <p className="mt-1 text-sm text-white/50">{t("updatedAt", { date: updatedAt })}</p>
    </Link>
  );
}
