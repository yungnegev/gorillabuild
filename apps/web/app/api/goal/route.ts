import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createGoal, getActiveGoalsWithProgress } from "@/lib/goals";
import { createGoalSchema } from "@gorillabuild/shared";

export const dynamic = "force-dynamic";

/** GET /api/goal — все активные цели пользователя */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getActiveGoalsWithProgress(userId);

  return NextResponse.json(result);
}

/** POST /api/goal — создаёт цель (деактивирует предыдущую для того же упражнения) */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createGoalSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const goal = await createGoal(userId, body.data);

  return NextResponse.json(goal, { status: 201 });
}
