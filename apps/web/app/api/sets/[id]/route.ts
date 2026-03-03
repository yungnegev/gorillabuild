import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateSetSchema } from "@gorillabuild/shared";
import { updateSet, deleteSet } from "@/lib/sets";

/** PATCH /api/sets/[id] — обновляет подход */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setId = Number((await params).id);
  if (isNaN(setId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = updateSetSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const result = await updateSet(userId, setId, body.data);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(result);
}

/** DELETE /api/sets/[id] — удаляет подход */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setId = Number((await params).id);
  if (isNaN(setId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const deleted = await deleteSet(userId, setId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
