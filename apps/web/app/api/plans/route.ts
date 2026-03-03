import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createPlanSchema } from "@gorillabuild/shared";
import { getPlans, createPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

/** GET /api/plans — список планов пользователя */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await getPlans(userId);
  return NextResponse.json(plans);
}

/** POST /api/plans — создаёт новый план */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createPlanSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const plan = await createPlan(userId, body.data);
  return NextResponse.json(plan, { status: 201 });
}
