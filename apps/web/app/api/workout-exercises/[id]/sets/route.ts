import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSetSchema } from "@gorillabuild/shared";
import { addSet } from "@/lib/sets";

/** POST /api/workout-exercises/[id]/sets — добавляет подход */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const weId = Number(id);
  if (isNaN(weId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = createSetSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const result = await addSet(userId, weId, body.data);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(result, { status: 201 });
}
