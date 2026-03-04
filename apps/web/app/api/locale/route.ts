import { defaultLocale, isLocale } from "@gorillabuild/i18n";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const candidate = typeof body?.locale === "string" ? body.locale : null;
  const locale = candidate && isLocale(candidate) ? candidate : defaultLocale;

  const response = NextResponse.json({ ok: true });
  response.cookies.set("NEXT_LOCALE", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
