import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { exercises, friendships, setEntries, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

export const dynamic = "force-dynamic";

/**
 * GET /api/friends/[id]/exercises
 * Упражнения, где хотя бы один из двух пользователей имеет данные.
 * Возвращает лучший 1RM каждого.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendshipId = Number((await params).id);
  if (isNaN(friendshipId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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

  if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const result = [...exerciseMap.entries()]
    .map(([id, v]) => ({
      id,
      name: v.name,
      myBestOneRm: v.myBest != null ? Math.round(v.myBest * 10) / 10 : null,
      friendBestOneRm: v.friendBest != null ? Math.round(v.friendBest * 10) / 10 : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(result);
}
