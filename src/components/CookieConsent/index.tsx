"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setStoredConsent, type ConsentValue } from "@/lib/cookieConsent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only reveal the banner if no choice is on record — avoids flashing it
    // for a returning visitor who already decided (SSR/first paint always
    // start hidden since localStorage isn't known until this effect runs).
    if (getStoredConsent() === null) setVisible(true);
  }, []);

  function decide(value: ConsentValue) {
    setStoredConsent(value);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/30 bg-slate-950/95 px-4 py-4 backdrop-blur sm:px-6"
          role="region"
          aria-label="Cookie and data notice"
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-center text-xs text-tertiary sm:text-left sm:text-sm">
              This site only stores a chat ID and logs your messages if you choose to
              use the chat assistant, so it can hold a conversation and so the answers
              can be reviewed and improved. No third-party ads or tracking cookies are
              used. Declining just turns the chat off — nothing else on the site is
              affected.{" "}
              <Link href="/privacy" className="text-primary underline hover:no-underline">
                Learn more
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => decide("declined")}>
                Decline
              </Button>
              <Button size="sm" onClick={() => decide("accepted")}>
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
