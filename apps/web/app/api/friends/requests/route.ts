import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFriendRequests } from "@/lib/friends";

export const dynamic = "force-dynamic";

/** GET /api/friends/requests — входящие заявки (pending) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await getFriendRequests(userId);
  return NextResponse.json(requests);
}
