"use client";

import Image from "next/image";
import { useState } from "react";

import { AvatarPlaceholder } from "@/app/_components/AvatarPlaceholder";
import type { FriendRequestItem } from "@/lib/friends";

interface Props {
  request: FriendRequestItem;
  isAccepting?: boolean;
  onAccept: () => void;
}

export function FriendRequestCard({ request, isAccepting = false, onAccept }: Props) {
  const [imageError, setImageError] = useState(false);
  const displayName = request.name || request.username || request.fromUserId;
  const showImage = request.imageUrl && !imageError;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:border-white/20 hover:bg-white/5">
      {showImage ? (
        <Image
          src={request.imageUrl!}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <AvatarPlaceholder size={40} />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{displayName}</p>
        {request.username && request.name && (
          <p className="text-sm text-white/50">@{request.username}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onAccept}
        disabled={isAccepting}
        className="shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAccepting ? "Принятие…" : "Принять"}
      </button>
    </li>
  );
}
