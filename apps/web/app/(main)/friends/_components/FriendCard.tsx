"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AvatarPlaceholder } from "@/app/_components/AvatarPlaceholder";
import type { FriendItem } from "@/lib/friends";

interface Props {
  friend: FriendItem;
}

export function FriendCard({ friend }: Props) {
  const [imageError, setImageError] = useState(false);
  const displayName = friend.name || friend.username || friend.userId;
  const showImage = friend.imageUrl && !imageError;

  return (
    <Link
      href={`/friends/${friend.friendshipId}`}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:border-white/20 hover:bg-white/5"
    >
      {showImage ? (
        <Image
          src={friend.imageUrl!}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <AvatarPlaceholder size={40} />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{displayName}</p>
        {friend.username && friend.name && (
          <p className="text-sm text-white/50">@{friend.username}</p>
        )}
      </div>
    </Link>
  );
}
