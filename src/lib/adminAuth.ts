// src/lib/adminAuth.ts
//
// Minimal, right-sized auth for a single-owner admin panel: one shared
// secret (ADMIN_PASSWORD), no user accounts, no session store. The cookie
// is a stateless HMAC-signed token — `${expiresAtMs}.${hmac}` — verified
// fresh on every request, so there's no server-side session row to manage
// or clean up. Using ADMIN_PASSWORD itself as the HMAC key means rotating
// the password automatically invalidates every previously-issued cookie —
// a free "log out everyone" side effect, useful if the password ever leaks.
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(candidate: string): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || typeof candidate !== "string" || candidate.length === 0) return false;
  return safeEqual(candidate, secret);
}

export function createSessionToken(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const expiresAt = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt), secret)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !token) return false;
  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return safeEqual(sign(expiresAtRaw, secret), signature);
}
