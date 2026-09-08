// src/lib/adminGuard.ts
//
// The /admin page and its API routes are a local-dev-only testing tool —
// never meant to be reachable once deployed. This is a defense-in-depth
// safety net in case it's ever built/started with NODE_ENV=production by
// accident; it is not an access-control mechanism on its own.
import { NextResponse } from "next/server";

export function blockInProduction(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  return null;
}
