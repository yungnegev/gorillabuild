import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureUser, getUser, updateUser } from "@/lib/users";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(userId);

  const user = await getUser(userId);
  const clerkUser = await currentUser();

  return NextResponse.json({
    id: user!.id,
    username: user!.username,
    units: user!.units,
    email: clerkUser?.emailAddresses[0]?.emailAddress,
    name: clerkUser?.fullName,
    imageUrl: clerkUser?.imageUrl,
    createdAt: user!.createdAt,
  });
}

const updateMeSchema = z.object({
  username: z.string().min(1).optional(),
  units: z.enum(["kg"]).optional(),
});

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = updateMeSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const result = await updateUser(userId, body.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const clerkUser = await currentUser();

  return NextResponse.json({
    id: result.user.id,
    username: result.user.username,
    units: result.user.units,
    email: clerkUser?.emailAddresses[0]?.emailAddress,
    name: clerkUser?.fullName,
    imageUrl: clerkUser?.imageUrl,
    createdAt: result.user.createdAt,
  });
}
