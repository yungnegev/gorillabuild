import { auth } from "@clerk/nextjs/server";
import { getFriendRequests, getFriends } from "@/lib/friends";
import { FriendsPageClient } from "./_components/FriendsPageClient";

export default async function FriendsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [initialFriends, initialRequests] = await Promise.all([
    getFriends(userId),
    getFriendRequests(userId),
  ]);

  return (
    <FriendsPageClient
      initialFriends={initialFriends}
      initialRequests={initialRequests}
    />
  );
}
