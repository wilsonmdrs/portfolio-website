// src/app/api/admin/login/route.ts
//
// Deliberately does NOT call blockInProduction() — this route must stay
// reachable in production without a cookie, precisely so a visitor with the
// password can obtain one. It's the one admin route where that's correct.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  createSessionToken,
  verifyPassword,
} from "@/lib/adminAuth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "Admin login is not configured (ADMIN_PASSWORD missing)" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
