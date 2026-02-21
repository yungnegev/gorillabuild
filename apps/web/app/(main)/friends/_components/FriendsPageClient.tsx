"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FriendItem, FriendRequestItem } from "@/lib/friends";
import { AddFriendForm } from "./AddFriendForm";
import { FriendCard } from "./FriendCard";

interface Props {
  initialFriends: FriendItem[];
  initialRequests: FriendRequestItem[];
}

export function FriendsPageClient({ initialFriends, initialRequests }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

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
    const res = await fetch(`/api/friends/${friendshipId}/accept`, { method: "PATCH" });
    if (!res.ok) throw new Error("Не удалось принять заявку");
    router.refresh();
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
            Add friend
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
          <ul className="space-y-2">
            {initialRequests.map((req) => (
              <li
                key={req.friendshipId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3"
              >
                <span className="font-medium">
                  {req.name || req.username || req.fromUserId}
                  {req.username && (
                    <span className="ml-1 text-sm text-white/50">@{req.username}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleAcceptRequest(req.friendshipId)}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-white/90"
                >
                  Принять
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {initialFriends.length === 0 && initialRequests.length === 0 && !showAddForm && (
          <div className="rounded-xl border border-white/10 p-6 text-center">
            <p className="text-white/50">Друзей пока нет</p>
            <p className="mt-2 text-sm text-white/40">
              Нажмите «Add friend» и введите handle пользователя, чтобы отправить заявку.
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
