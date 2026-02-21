import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getExercises } from "@/lib/exercises";

export const dynamic = "force-dynamic";

/** GET /api/exercises — список всех упражнений */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await getExercises();

  return NextResponse.json(rows);
}
