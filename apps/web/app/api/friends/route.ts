import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getFriends, sendFriendRequest } from "@/lib/friends";

export const dynamic = "force-dynamic";

/** GET /api/friends — принятые друзья */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friends = await getFriends(userId);
  return NextResponse.json(friends);
}

const sendRequestSchema = z.object({ handle: z.string().min(1) });

/** POST /api/friends — отправляет запрос дружбы по handle */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = sendRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const result = await sendFriendRequest(userId, body.data.handle);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.friendship, { status: 201 });
}
