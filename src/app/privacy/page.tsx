import Link from "next/link";
import type { Metadata } from "next";
import { RevokeConsent } from "@/components/RevokeConsent";

export const metadata: Metadata = {
  title: "Privacy & Cookies · Wilson Medeiros",
  description: "What this site stores in your browser and what the chat assistant logs.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-tertiary">
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Back home
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Privacy &amp; Cookies</h1>
          <p className="mt-2 text-sm text-tertiary">
            Last updated: {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
        <RevokeConsent />
      </div>

      <div className="mt-8 space-y-8 text-sm leading-relaxed sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Consent-gated: nothing until you accept</h2>
          <p className="mt-2">
            The chat ID and message logging described below only happen after you
            accept the notice — either the banner at the bottom of the page or the
            prompt inside the chat widget itself. Declining (or not deciding) means the
            chat feature stays off and nothing is stored or sent. Nothing else on the
            site is affected either way, and you can change your mind at any time from
            the same prompt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Local storage</h2>
          <p className="mt-2">
            Once you accept, your browser generates a random ID and saves it in local
            storage (not a tracking cookie) so the assistant can hold a conversation
            with you and so you can pick it back up on a page refresh. Your theme
            preference (light/dark) is stored the same way regardless of chat consent,
            purely for display, and isn&apos;t sent anywhere. Neither value identifies
            you personally or is shared with anyone.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Chat logs</h2>
          <p className="mt-2">
            Messages you send the chat assistant and its replies are logged on the
            server, tied to that random ID — not your name or any account, unless you
            type it into the chat yourself. This lets the conversation continue across
            turns and lets me (Wilson) review how the assistant is doing and fix or
            improve its answers — the legal basis is my legitimate interest in
            maintaining and improving this demo. Logs are kept in a Redis database
            (Redis Cloud) capped at the 3,000 most recent messages across all visitors,
            and the site itself is hosted on Vercel; both are standard infrastructure
            providers, not data buyers. Logs are never sold, shared with third parties,
            or used for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">No third-party tracking</h2>
          <p className="mt-2">
            This site does not use advertising cookies, third-party analytics, or
            cross-site tracking of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Your choices &amp; rights</h2>
          <p className="mt-2">
            Declining or clearing your browser&apos;s local storage for this site
            removes your chat ID — the next visit (or acceptance) starts a fresh,
            unlinked conversation. Under GDPR you can ask me to access or delete any
            conversation tied to an ID you recognize as yours — use the{" "}
            <span className="text-foreground">Revoke chat consent</span> button at the
            top of this page to do it yourself right now, or email{" "}
            <a href="mailto:wilsonmdrs@gmail.com" className="text-primary hover:underline">
              wilsonmdrs@gmail.com
            </a>{" "}
            and I&apos;ll act on it directly, since this is a one-person site with no
            separate data team.
          </p>
        </section>
      </div>
    </div>
  );
}
