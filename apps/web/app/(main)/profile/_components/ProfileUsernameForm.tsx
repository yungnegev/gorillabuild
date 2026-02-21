"use client";

import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface Props {
  currentUsername: string | null;
  onSaved: (username: string) => void;
}

export function ProfileUsernameForm({ currentUsername, onSaved }: Props) {
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    if (!currentUsername) return;
    (e.currentTarget as HTMLButtonElement).blur();
    try {
      await navigator.clipboard.writeText(currentUsername);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Не удалось скопировать");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Введите ник");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          res.status === 409
            ? "Этот ник уже занят"
            : typeof data.error === "string"
              ? data.error
              : "Не удалось сохранить";
        throw new Error(message);
      }
      onSaved(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (currentUsername) {
    return (
      <div className="rounded-xl border border-white/10 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/50">Ник</span>
          <span className="text-white">{currentUsername}</span>
          <button
            type="button"
            onClick={handleCopy}
            title="Скопировать"
            aria-label="Скопировать ник"
            className="cursor-pointer rounded p-0.5 text-white/50 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-400" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && <p className="mt-1.5 text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 px-4 py-3 text-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="profile-username" className="text-white/50">
          Ник
        </label>
        <input
          id="profile-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="gorilla42"
          title="Задаётся один раз, по нику вас добавляют в друзья"
          className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none min-w-[10rem]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {submitting ? "…" : "Сохранить"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-red-400">{error}</p>}
    </form>
  );
}
