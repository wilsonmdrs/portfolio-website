"use client";

import { useState } from "react";
import { splitVars } from "../types";

function VarRow({ name, value }: { name: string; value: unknown }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-xs">
      <span className="font-mono text-muted-foreground">{name}</span>
      <span className="font-mono text-right break-all">{String(value)}</span>
    </div>
  );
}

export function VarsInspector({ vars }: { vars: Record<string, unknown> | null }) {
  const [showRaw, setShowRaw] = useState(false);
  const { curated, rest } = splitVars(vars);

  if (!vars) {
    return <p className="text-xs text-muted-foreground">No vars yet — send a message first.</p>;
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3">
      {Object.entries(curated).map(([key, value]) => (
        <VarRow key={key} name={key} value={value} />
      ))}
      <button
        type="button"
        className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
        onClick={() => setShowRaw((v) => !v)}
      >
        {showRaw ? "Hide" : "Show"} raw uservars ({Object.keys(rest).length} more)
      </button>
      {showRaw && (
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-background p-2 text-[10px] leading-snug">
          {JSON.stringify(rest, null, 2)}
        </pre>
      )}
    </div>
  );
}
