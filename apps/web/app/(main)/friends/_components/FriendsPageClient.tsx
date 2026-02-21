"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { FriendItem, FriendRequestItem } from "@/lib/friends";
import { AddFriendForm } from "./AddFriendForm";
import { FriendCard } from "./FriendCard";
import { FriendRequestCard } from "./FriendRequestCard";

interface Props {
  initialFriends: FriendItem[];
  initialRequests: FriendRequestItem[];
}

export function FriendsPageClient({ initialFriends, initialRequests }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  async function handleAddFriend(handle: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        typeof data.error === "string"
          ? data.error
          : data.error?.message ?? "Не удалось отправить заявку";
      throw new Error(message);
    }
    setShowAddForm(false);
    router.refresh();
  }

  async function handleAcceptRequest(friendshipId: number) {
    setAcceptError(null);
    setAcceptingId(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}/accept`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Не удалось принять заявку";
        setAcceptError(message);
        return;
      }
      router.refresh();
    } catch {
      setAcceptError("Не удалось принять заявку");
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Друзья</h1>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Добавить друга
          </button>
        )}
      </div>

      {showAddForm && (
        <AddFriendForm
          onSubmit={handleAddFriend}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {initialRequests.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-white/70">Входящие заявки</h2>
          {acceptError && (
            <p className="text-sm text-red-400" role="alert">
              {acceptError}
            </p>
          )}
          <ul className="space-y-3">
            {initialRequests.map((req) => (
              <FriendRequestCard
                key={req.friendshipId}
                request={req}
                isAccepting={acceptingId === req.friendshipId}
                onAccept={() => handleAcceptRequest(req.friendshipId)}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {initialFriends.length === 0 && initialRequests.length === 0 && !showAddForm && (
          <div className="rounded-xl border border-white/10 p-6 text-center">
            <p className="text-white/50">Друзей пока нет</p>
            <p className="mt-2 text-sm text-white/40">
              Нажмите «Добавить друга» и введите handle пользователя, чтобы отправить заявку.
            </p>
          </div>
        )}
        {initialFriends.length > 0 && (
          <ul className="space-y-3">
            {initialFriends.map((friend) => (
              <li key={friend.friendshipId}>
                <FriendCard friend={friend} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
