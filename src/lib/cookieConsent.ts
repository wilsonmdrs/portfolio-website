"use client";

import { useEffect, useState } from "react";

// Shared consent state for the chat widget's local-storage ID + server-side
// logging (see CookieConsent and components/Chat). A plain localStorage key
// rather than React context, since the banner and the chat widget are
// unrelated siblings in page.tsx — a CustomEvent lets the chat widget react
// immediately when the banner is answered, without a page reload or a
// context provider wrapping both.
export type ConsentValue = "accepted" | "declined";

const CONSENT_KEY = "wm-cookie-consent";
const CONSENT_EVENT = "wm-cookie-consent-change";

export function getStoredConsent(): ConsentValue | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw === "accepted" || raw === "declined" ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: ConsentValue): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage blocked (private mode) — the CustomEvent below still updates
    // this tab's UI for the current session, it just won't persist.
  }
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}

/** Null until a choice has been made (or read from a prior visit). */
export function useCookieConsent(): ConsentValue | null {
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
    const handle = (e: Event) => setConsent((e as CustomEvent<ConsentValue>).detail);
    window.addEventListener(CONSENT_EVENT, handle);
    return () => window.removeEventListener(CONSENT_EVENT, handle);
  }, []);

  return consent;
}

// The chat widget's persisted identifier (see components/Chat) — kept here
// too since revoking consent (RevokeConsent, on /privacy) always pairs
// "forget this ID" with "forget this choice," and both need the same key.
export const CHAT_USER_ID_KEY = "wm-chat-user-id";

export function getStoredChatUserId(): string | null {
  try {
    return window.localStorage.getItem(CHAT_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function clearStoredChatUserId(): void {
  try {
    window.localStorage.removeItem(CHAT_USER_ID_KEY);
  } catch {
    // ignore
  }
}
