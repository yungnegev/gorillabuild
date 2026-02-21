"use client";

import { useState } from "react";

interface Props {
  onSubmit: (handle: string) => Promise<void>;
  onCancel: () => void;
}

export function AddFriendForm({ onSubmit, onCancel }: Props) {
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!trimmed) {
      setError("Введите handle пользователя");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setHandle("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось отправить заявку. Попробуйте ещё раз.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="font-medium">Добавить друга</p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <label className="block">
        <span className="text-sm text-white/60">Handle (ник в системе)</span>
        <p className="mt-0.5 text-xs text-white/40">
          Ник задаётся в профиле. При входе через Gmail его нужно указать отдельно.
        </p>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="например: gorilla42"
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
          {submitting ? "Отправка…" : "Отправить заявку"}
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
