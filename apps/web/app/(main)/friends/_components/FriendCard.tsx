import Image from "next/image";
import Link from "next/link";

import type { FriendItem } from "@/lib/friends";

interface Props {
  friend: FriendItem;
}

export function FriendCard({ friend }: Props) {
  const displayName = friend.name || friend.username || friend.userId;

  return (
    <Link
      href={`/friends/${friend.friendshipId}`}
      className="flex items-center gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:border-white/20 hover:bg-white/5"
    >
      {friend.imageUrl ? (
        <Image
          src={friend.imageUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white"
        >
          {(displayName || "?").charAt(0).toUpperCase()}
        </div>
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
