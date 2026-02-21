import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { bodyWeightEntries, exercises, friendships, setEntries, users, workoutExercises, workouts } from "@/db/schema";
import { calcOneRm } from "@/lib/1rm";

export const dynamic = "force-dynamic";

async function buildSeries(targetUserId: string, exerciseId: number) {
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

async function getBodyWeightsForUser(targetUserId: string): Promise<{ date: string; weightKg: number }[]> {
  return db
    .select({ date: bodyWeightEntries.date, weightKg: bodyWeightEntries.weightKg })
    .from(bodyWeightEntries)
    .where(eq(bodyWeightEntries.userId, targetUserId))
    .orderBy(bodyWeightEntries.date);
}

/**
 * GET /api/friends/[id]/exercises/[exerciseId]
 * Возвращает данные сравнения "я vs друг" по упражнению.
 * [id] — friendshipId
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, exerciseId: exIdStr } = await params;
  const friendshipId = Number(id);
  const exerciseId = Number(exIdStr);

  if (isNaN(friendshipId) || isNaN(exerciseId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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

  if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const friendId = friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const [myUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [friendUser] = await db.select().from(users).where(eq(users.id, friendId)).limit(1);

  const [myPoints, friendPoints, myBodyWeights, friendBodyWeights] = await Promise.all([
    buildSeries(userId, exerciseId),
    buildSeries(friendId, exerciseId),
    getBodyWeightsForUser(userId),
    getBodyWeightsForUser(friendId),
  ]);

  return NextResponse.json({
    exercise,
    mine: { userId, username: myUser?.username ?? null, points: myPoints, bodyWeights: myBodyWeights },
    friend: { userId: friendId, username: friendUser?.username ?? null, points: friendPoints, bodyWeights: friendBodyWeights },
  });
}
