import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deactivateGoalById } from "@/lib/goals";

export const dynamic = "force-dynamic";

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
