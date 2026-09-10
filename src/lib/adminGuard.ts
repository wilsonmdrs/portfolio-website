// src/lib/adminGuard.ts
//
// The /admin page and its API routes are unrestricted in dev (local
// testing tool), but reachable in production too now, gated by a
// password-derived cookie — see adminAuth.ts. This is the API-route-side
// check; src/app/admin/(protected)/layout.tsx is the matching page-side
// gate, since routes don't render through that layout.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "./adminAuth";

export async function blockInProduction(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== "production") return null; // unchanged dev behavior: no auth at all
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (isValidSessionToken(token)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
