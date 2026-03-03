import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updatePlanSchema } from "@gorillabuild/shared";
import { getPlan, updatePlan, deletePlan } from "@/lib/plans";

/** GET /api/plans/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = Number((await params).id);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const plan = await getPlan(planId, userId);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(plan);
}

/** PATCH /api/plans/[id] — обновляет имя и/или упражнения */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = Number((await params).id);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = updatePlanSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const updated = await updatePlan(userId, planId, body.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

/** DELETE /api/plans/[id] — удаление плана (сначала plan_exercises, затем план) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = Number((await params).id);
  if (isNaN(planId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const deleted = await deletePlan(userId, planId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
