import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createBodyWeightEntrySchema } from "@gorillabuild/shared";
import { getBodyWeightEntries, createBodyWeightEntry } from "@/lib/body-weight";

export const dynamic = "force-dynamic";

/** GET /api/body-weight — список записей массы тела */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await getBodyWeightEntries(userId);
  return NextResponse.json(rows);
}

/** POST /api/body-weight — добавляет запись */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createBodyWeightEntrySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const entry = await createBodyWeightEntry(userId, body.data);
  return NextResponse.json(entry, { status: 201 });
}
