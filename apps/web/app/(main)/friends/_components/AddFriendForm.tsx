"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  onSubmit: (handle: string) => Promise<void>;
  onCancel: () => void;
}

export function AddFriendForm({ onSubmit, onCancel }: Props) {
  const t = useTranslations("friends.form");
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!trimmed) {
      setError(t("requiredHandle"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setHandle("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("sendFailed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 p-4">
      <p className="font-medium">{t("title")}</p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <label className="block">
        <span className="text-sm text-white/60">{t("handleLabel")}</span>
        <p className="mt-0.5 text-xs text-white/40">
          {t("handleHelp")}
        </p>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={t("handlePlaceholder")}
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
          {submitting ? t("submitting") : t("submit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
