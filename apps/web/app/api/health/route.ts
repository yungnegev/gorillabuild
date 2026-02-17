import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const start = Date.now();
    await db.run(sql`SELECT 1`);
    const latency = Date.now() - start;
    return NextResponse.json({ status: "ok", latency, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
