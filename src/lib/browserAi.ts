"use client";

// Wraps Chrome's on-device Prompt API (window.LanguageModel, formerly
// window.ai.languageModel). Only available in recent desktop Chrome, and
// only after the on-device model has been downloaded.

import { CV_SYSTEM_PROMPT } from "./cvContext";

type BrowserAISession = {
  prompt: (input: string) => Promise<string>;
  destroy?: () => void;
};

type LanguageModelApi = {
  availability?: (options?: unknown) => Promise<string>;
  capabilities?: () => Promise<{ available?: string }>;
  create: (options?: unknown) => Promise<BrowserAISession>;
};

function getLanguageModelApi(): LanguageModelApi | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    LanguageModel?: LanguageModelApi;
    ai?: { languageModel?: LanguageModelApi };
  };
  return w.LanguageModel ?? w.ai?.languageModel ?? null;
}

export type BrowserAIStatus =
  | "available" // model ready, can prompt immediately
  | "downloadable" // model not fetched yet, create() will trigger a download
  | "downloading" // download already in progress
  | "unavailable" // API exists but device/browser can't run it
  | "no-api"; // window.LanguageModel / window.ai.languageModel doesn't exist

export async function getBrowserAIStatus(): Promise<BrowserAIStatus> {
  const api = getLanguageModelApi();
  if (!api) return "no-api";

  try {
    if (typeof api.availability === "function") {
      const status = await api.availability();
      if (status === "available" || status === "downloadable" || status === "downloading") {
        return status;
      }
      return "unavailable";
    }
    if (typeof api.capabilities === "function") {
      const caps = await api.capabilities();
      if (caps?.available === "readily") return "available";
      if (caps?.available === "after-download") return "downloadable";
      return "unavailable";
    }
  } catch {
    return "unavailable";
  }
  return "unavailable";
}

export async function isBrowserAIAvailable(): Promise<boolean> {
  const status = await getBrowserAIStatus();
  return status === "available" || status === "downloadable" || status === "downloading";
}

let sessionPromise: Promise<BrowserAISession> | null = null;

async function createSession(): Promise<BrowserAISession> {
  const api = getLanguageModelApi();
  if (!api || typeof api.create !== "function") {
    throw new Error("Browser AI is not available");
  }

  // Current spec uses `initialPrompts`; older origin-trial builds used `systemPrompt`.
  try {
    return await api.create({
      initialPrompts: [{ role: "system", content: CV_SYSTEM_PROMPT }],
    });
  } catch {
    return await api.create({ systemPrompt: CV_SYSTEM_PROMPT });
  }
}

function getBrowserAISession(): Promise<BrowserAISession> {
  if (!sessionPromise) sessionPromise = createSession();
  return sessionPromise;
}

export async function askBrowserAI(message: string): Promise<string> {
  const session = await getBrowserAISession();
  const reply = await session.prompt(message);
  return reply?.trim() || "";
}

export function resetBrowserAISession(): void {
  sessionPromise?.then((s) => s.destroy?.()).catch(() => {});
  sessionPromise = null;
}
