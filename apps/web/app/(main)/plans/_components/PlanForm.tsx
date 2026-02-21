"use client";

import { useState } from "react";

interface Props {
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
}

export function PlanForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите название плана");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: trimmed });
    } catch {
      setError("Не удалось создать план. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="font-medium">Новый план</p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <label className="block">
        <span className="text-sm text-white/60">Название</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Силовая понедельник"
          className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          autoFocus
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {submitting ? "Создаём…" : "Создать"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
