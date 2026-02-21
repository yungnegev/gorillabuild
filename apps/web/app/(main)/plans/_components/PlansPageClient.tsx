"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PlanListItem } from "@/lib/plans";
import { PlanCard } from "./PlanCard";
import { PlanForm } from "./PlanForm";

interface Props {
  initialPlans: PlanListItem[];
}

export function PlansPageClient({ initialPlans }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(data: { name: string }) {
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, exercises: [] }),
    });
    if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
    setShowForm(false);
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Планы</h1>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              + Добавить план
            </button>
          )}
          <Link
            href="/workout/active"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Start empty workout
          </Link>
        </div>
      </div>

      {showForm && (
        <PlanForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {initialPlans.length === 0 && !showForm && (
        <div className="rounded-xl border border-white/10 p-6 text-center">
          <p className="text-white/50">Планов пока нет</p>
          <p className="mt-2 text-sm text-white/40">
            Нажмите «Добавить план», чтобы создать первый, или «Start empty workout» для пустой тренировки.
          </p>
        </div>
      )}

      {initialPlans.length > 0 && (
        <div className="space-y-3">
          {initialPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </section>
  );
}
