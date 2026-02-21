import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bodyWeightEntries } from "@/db/schema";
import { createBodyWeightEntrySchema } from "@gorillabuild/shared";

export const dynamic = "force-dynamic";

/** GET /api/body-weight — список записей массы тела */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(bodyWeightEntries)
    .where(eq(bodyWeightEntries.userId, userId))
    .orderBy(desc(bodyWeightEntries.date));

  return NextResponse.json(rows);
}

/** POST /api/body-weight — добавляет запись */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createBodyWeightEntrySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const [entry] = await db
    .insert(bodyWeightEntries)
    .values({ userId, date: body.data.date, weightKg: body.data.weightKg })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
