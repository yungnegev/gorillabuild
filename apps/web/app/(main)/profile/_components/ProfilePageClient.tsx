"use client";

import type { BodyWeightEntry, User } from "@gorillabuild/shared/schemas";
import { useEffect, useMemo, useState } from "react";
import { Loader } from "@/app/_components/Loader";
import { BodyWeightChart } from "./BodyWeightChart";
import { BodyWeightForm } from "./BodyWeightForm";
import { BodyWeightHistory } from "./BodyWeightHistory";
import { ProfileUsernameForm } from "./ProfileUsernameForm";

function pickLatestEntry(entries: BodyWeightEntry[]): BodyWeightEntry | null {
  if (entries.length === 0) return null;

  return entries.reduce((latest, current) => {
    const dateCompare = current.date.localeCompare(latest.date);
    if (dateCompare > 0) return current;
    if (dateCompare < 0) return latest;
    return current.id > latest.id ? current : latest;
  });
}

export function ProfilePageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const latestEntry = useMemo(() => pickLatestEntry(entries), [entries]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const [userRes, entriesRes] = await Promise.all([
          fetch("/api/users/me", { cache: "no-store" }),
          fetch("/api/body-weight", { cache: "no-store" }),
        ]);

        if (!userRes.ok) throw new Error(`Ошибка профиля: ${userRes.status}`);
        if (!entriesRes.ok) throw new Error(`Ошибка веса: ${entriesRes.status}`);

        const [userData, entriesData] = await Promise.all([
          userRes.json() as Promise<User>,
          entriesRes.json() as Promise<BodyWeightEntry[]>,
        ]);

        if (!cancelled) {
          setUser(userData);
          setEntries(entriesData);
          const last = pickLatestEntry(entriesData);
          if (last) {
            setWeightKg(last.weightKg.toString());
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Неизвестная ошибка");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numericWeight = Number(weightKg);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setError("Укажи корректный вес");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/body-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, weightKg: numericWeight }),
      });

      if (!res.ok) throw new Error(`Ошибка сохранения: ${res.status}`);

      const created = (await res.json()) as BodyWeightEntry;
      setEntries((prev) => [created, ...prev]);
      setWeightKg(created.weightKg.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Профиль</h1>
        <div className="rounded-xl border border-white/10 p-4">
          <Loader message="Загружаем данные профиля..." />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Профиль</h1>

      {user && (
        <>
          <div className="rounded-xl border border-white/10 p-4 text-sm">
            <p className="text-white/70">
              Имя: <span className="text-white">{user.name ?? "—"}</span>
            </p>
          </div>

          <ProfileUsernameForm
            currentUsername={user.username ?? null}
            onSaved={(username) =>
              setUser((prev) => (prev ? { ...prev, username } : null))
            }
          />
        </>
      )}

      <BodyWeightForm
        today={today}
        weightKg={weightKg}
        latestWeightKg={latestEntry?.weightKg ?? null}
        submitting={submitting}
        disabled={loading}
        onSubmit={handleSubmit}
        onWeightChange={setWeightKg}
      />

      <BodyWeightChart entries={entries} />

      <BodyWeightHistory entries={entries} />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}