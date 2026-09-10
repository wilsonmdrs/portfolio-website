"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  clearStoredChatUserId,
  getStoredChatUserId,
  setStoredConsent,
  useCookieConsent,
} from "@/lib/cookieConsent";

type Status = "confirm" | "working" | "done" | "error";

export function RevokeConsent() {
  const consent = useCookieConsent();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("confirm");
  const nothingToRevoke = consent !== "accepted";

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setStatus("confirm"); // reset for the next time it's opened
  }

  async function revoke() {
    setStatus("working");
    const userId = getStoredChatUserId();
    try {
      if (userId) {
        const res = await fetch("/api/chat/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      clearStoredChatUserId();
      setStoredConsent("declined");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Revoke chat consent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{status === "done" ? "Consent revoked" : "Revoke chat consent?"}</DialogTitle>
          <DialogDescription>
            {status === "done"
              ? "Your chat ID has been removed from this browser and every message logged under it has been deleted from the server. The chat widget will ask again next time you use it."
              : nothingToRevoke
                ? "You haven't accepted the chat's data notice yet, so there's nothing stored to revoke."
                : "This deletes your chat ID from this browser and every message logged under it on the server, immediately. This can't be undone."}
          </DialogDescription>
        </DialogHeader>

        {status === "error" ? (
          <p className="text-sm text-destructive">
            Something went wrong — please try again, or email{" "}
            <a href="mailto:wilsonmdrs@gmail.com" className="underline">
              wilsonmdrs@gmail.com
            </a>
            .
          </p>
        ) : null}

        <DialogFooter>
          {status === "done" || nothingToRevoke ? (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={status === "working"}
              >
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={revoke} disabled={status === "working"}>
                {status === "working" ? "Revoking…" : "Yes, revoke & delete"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
