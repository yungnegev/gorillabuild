import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateGoalSchema } from "@gorillabuild/shared";
import { deactivateGoalById, updateGoal } from "@/lib/goals";

export const dynamic = "force-dynamic";

/** PATCH /api/goal/[id] — обновляет цель (targetOneRm, targetDate) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goalId = Number(id);
  if (!Number.isInteger(goalId) || goalId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = updateGoalSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const updated = await updateGoal(userId, goalId, body.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/goal/[id] — деактивирует конкретную цель */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goalId = Number(id);
  if (!Number.isInteger(goalId) || goalId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const wasDeactivated = await deactivateGoalById(userId, goalId);
  if (!wasDeactivated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
