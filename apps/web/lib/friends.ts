import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises, friendships, setEntries, users, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

/** Принятый друг для списка на /friends */
export type FriendItem = {
  friendshipId: number;
  userId: string;
  username: string | null;
  name: string | null;
  imageUrl: string | null;
};

/** Входящая заявка в друзья */
export type FriendRequestItem = {
  friendshipId: number;
  fromUserId: string;
  username: string | null;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
};

/** Загружает принятых друзей текущего пользователя. */
export async function getFriends(userId: string): Promise<FriendItem[]> {
  const rows = await db
    .select({
      friendshipId: friendships.id,
      fromUserId: friendships.fromUserId,
      toUserId: friendships.toUserId,
    })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.fromUserId, userId), eq(friendships.toUserId, userId))
      )
    );

  const clerk = await clerkClient();

  const friends = await Promise.all(
    rows.map(async (row) => {
      const friendId = row.fromUserId === userId ? row.toUserId : row.fromUserId;
      const [dbUser] = await db.select().from(users).where(eq(users.id, friendId)).limit(1);
      const clerkUser = await clerk.users.getUser(friendId).catch(() => null);

      return {
        friendshipId: row.friendshipId,
        userId: friendId,
        username: dbUser?.username ?? null,
        name: clerkUser
          ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
          : null,
        imageUrl: clerkUser?.imageUrl ?? null,
      };
    })
  );

  return friends;
}

/** Загружает входящие заявки в друзья (pending, где toUserId = текущий пользователь). */
export async function getFriendRequests(userId: string): Promise<FriendRequestItem[]> {
  const rows = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.toUserId, userId), eq(friendships.status, "pending")));

  const clerk = await clerkClient();

  const requests = await Promise.all(
    rows.map(async (row) => {
      const [dbUser] = await db.select().from(users).where(eq(users.id, row.fromUserId)).limit(1);
      const clerkUser = await clerk.users.getUser(row.fromUserId).catch(() => null);

      return {
        friendshipId: row.id,
        fromUserId: row.fromUserId,
        username: dbUser?.username ?? null,
        name: clerkUser
          ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
          : null,
        imageUrl: clerkUser?.imageUrl ?? null,
        createdAt: row.createdAt.toISOString(),
      };
    })
  );

  return requests;
}

/** Профиль друга по friendshipId */
export type FriendDetail = {
  friendshipId: number;
  userId: string;
  username: string | null;
  name: string | null;
  imageUrl: string | null;
};

/** Краткое сравнение по одному упражнению */
export type FriendExerciseSummary = {
  id: number;
  name: string;
  myBestOneRm: number | null;
  friendBestOneRm: number | null;
};

/** Загружает профиль друга по friendshipId. Возвращает null, если дружба не найдена. */
export async function getFriendDetail(
  userId: string,
  friendshipId: number,
): Promise<FriendDetail | null> {
  const [friendship] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        eq(friendships.status, "accepted"),
        or(eq(friendships.fromUserId, userId), eq(friendships.toUserId, userId)),
      ),
    )
    .limit(1);

  if (!friendship) return null;

  const friendId =
    friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;

  const [dbUser] = await db.select().from(users).where(eq(users.id, friendId)).limit(1);
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(friendId).catch(() => null);

  return {
    friendshipId,
    userId: friendId,
    username: dbUser?.username ?? null,
    name: clerkUser
      ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
      : null,
    imageUrl: clerkUser?.imageUrl ?? null,
  };
}

/** Упражнения, где хотя бы один из пары имеет историю. Возвращает лучший 1RM каждого. */
export async function getFriendExercises(
  userId: string,
  friendshipId: number,
): Promise<FriendExerciseSummary[]> {
  const [friendship] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        eq(friendships.status, "accepted"),
        or(eq(friendships.fromUserId, userId), eq(friendships.toUserId, userId)),
      ),
    )
    .limit(1);

  if (!friendship) return [];

  const friendId =
    friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;

  const rows = await db
    .select({
      exerciseId: workoutExercises.exerciseId,
      exerciseName: exercises.name,
      userId: workouts.userId,
      weightKg: setEntries.weightKg,
      reps: setEntries.reps,
    })
    .from(setEntries)
    .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(
      and(inArray(workouts.userId, [userId, friendId]), isNotNull(workouts.finishedAt)),
    );

  const exerciseMap = new Map<
    number,
    { name: string; myBest: number | null; friendBest: number | null }
  >();

  for (const row of rows) {
    const oneRm = calcOneRm(row.weightKg, row.reps);
    const entry = exerciseMap.get(row.exerciseId) ?? {
      name: row.exerciseName,
      myBest: null,
      friendBest: null,
    };
    if (row.userId === userId) {
      entry.myBest = Math.max(entry.myBest ?? 0, oneRm);
    } else {
      entry.friendBest = Math.max(entry.friendBest ?? 0, oneRm);
    }
    exerciseMap.set(row.exerciseId, entry);
  }

  return [...exerciseMap.entries()]
    .map(([id, v]) => ({
      id,
      name: v.name,
      myBestOneRm: v.myBest != null ? Math.round(v.myBest * 10) / 10 : null,
      friendBestOneRm: v.friendBest != null ? Math.round(v.friendBest * 10) / 10 : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
