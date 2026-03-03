import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
  bodyWeightEntries,
  exercises,
  friendships,
  setEntries,
  users,
  workoutExercises,
  workouts,
} from "@/db/schema";
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

/** Результат sendFriendRequest */
export type SendFriendRequestResult =
  | { ok: true; friendship: typeof friendships.$inferSelect }
  | { ok: false; error: string; status: number };

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

/** Отправляет запрос дружбы по handle. */
export async function sendFriendRequest(
  userId: string,
  handle: string
): Promise<SendFriendRequestResult> {
  // Lazy-create user row
  await db.insert(users).values({ id: userId }).onConflictDoNothing();

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.username, handle))
    .limit(1);

  if (!target) return { ok: false, error: "User not found", status: 404 };
  if (target.id === userId) return { ok: false, error: "Cannot add yourself", status: 400 };

  // check duplicate
  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.fromUserId, userId), eq(friendships.toUserId, target.id)),
        and(eq(friendships.fromUserId, target.id), eq(friendships.toUserId, userId))
      )
    )
    .limit(1);

  if (existing) return { ok: false, error: "Request already exists", status: 409 };

  const [friendship] = await db
    .insert(friendships)
    .values({ fromUserId: userId, toUserId: target.id })
    .returning();

  return { ok: true, friendship };
}

/** Принимает заявку дружбы. Возвращает false, если заявка не найдена. */
export async function acceptFriendRequest(
  userId: string,
  friendshipId: number
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      and(eq(friendships.id, friendshipId), eq(friendships.toUserId, userId))
    )
    .limit(1);

  if (!row) return false;

  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(eq(friendships.id, friendshipId));

  return true;
}

/** Строит серию 1RM-точек для пользователя по упражнению. */
async function buildOneRmSeries(targetUserId: string, exerciseId: number) {
  const rows = await db
    .select({
      workoutId: workouts.id,
      startedAt: workouts.startedAt,
      weightKg: setEntries.weightKg,
      reps: setEntries.reps,
    })
    .from(setEntries)
    .innerJoin(workoutExercises, eq(setEntries.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workoutExercises.exerciseId, exerciseId),
        eq(workouts.userId, targetUserId),
        isNotNull(workouts.finishedAt)
      )
    );

  const byWorkout = new Map<
    number,
    { date: Date; oneRm: number; bestWeightKg: number; bestReps: number }
  >();

  for (const row of rows) {
    const oneRm = calcOneRm(row.weightKg, row.reps);
    const existing = byWorkout.get(row.workoutId);
    if (!existing || oneRm > existing.oneRm) {
      byWorkout.set(row.workoutId, {
        date: row.startedAt,
        oneRm,
        bestWeightKg: row.weightKg,
        bestReps: row.reps,
      });
    }
  }

  return [...byWorkout.entries()]
    .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
    .map(([workoutId, v]) => ({
      workoutId,
      date: v.date.toISOString(),
      oneRm: v.oneRm,
      bestWeightKg: v.bestWeightKg,
      bestReps: v.bestReps,
    }));
}

/** Загружает записи массы тела пользователя (date ASC). */
async function getBodyWeightsForUser(targetUserId: string) {
  return db
    .select({ date: bodyWeightEntries.date, weightKg: bodyWeightEntries.weightKg })
    .from(bodyWeightEntries)
    .where(eq(bodyWeightEntries.userId, targetUserId))
    .orderBy(bodyWeightEntries.date);
}

/** Данные сравнения "я vs друг" по конкретному упражнению. Возвращает null, если дружба или упражнение не найдены. */
export async function getFriendExerciseComparison(
  userId: string,
  friendshipId: number,
  exerciseId: number,
) {
  const [friendship] = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.id, friendshipId),
        eq(friendships.status, "accepted"),
        or(eq(friendships.fromUserId, userId), eq(friendships.toUserId, userId))
      )
    )
    .limit(1);

  if (!friendship) return null;

  const friendId = friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!exercise) return null;

  const [myUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [friendUser] = await db.select().from(users).where(eq(users.id, friendId)).limit(1);

  const [myPoints, friendPoints, myBodyWeights, friendBodyWeights] = await Promise.all([
    buildOneRmSeries(userId, exerciseId),
    buildOneRmSeries(friendId, exerciseId),
    getBodyWeightsForUser(userId),
    getBodyWeightsForUser(friendId),
  ]);

  return {
    exercise,
    mine: { userId, username: myUser?.username ?? null, points: myPoints, bodyWeights: myBodyWeights },
    friend: { userId: friendId, username: friendUser?.username ?? null, points: friendPoints, bodyWeights: friendBodyWeights },
  };
}
