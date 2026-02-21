import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getFriendDetail, getFriendExercises } from "@/lib/friends";
import { FriendDetailClient } from "./_components/FriendDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FriendDetailPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const friendshipId = Number((await params).id);
  if (isNaN(friendshipId)) notFound();

  const [friend, exercises] = await Promise.all([
    getFriendDetail(userId, friendshipId),
    getFriendExercises(userId, friendshipId),
  ]);

  if (!friend) notFound();

  return <FriendDetailClient friend={friend} initialExercises={exercises} />;
}
