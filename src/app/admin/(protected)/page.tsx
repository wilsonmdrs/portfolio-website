"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStat, Revocation } from "@/lib/interactionLog";
import type { Correction } from "@/lib/adminCorrections";

const RANGE_OPTIONS = [3, 7, 14, 30] as const;
const DEFAULT_DAYS = 3;

const CHART_1 = "var(--chart-1)";
const CHART_2 = "var(--chart-2)";
const DESTRUCTIVE = "var(--destructive)";
const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function AdminHomePage() {
  const [days, setDays] = useState<number>(DEFAULT_DAYS);
  const [dailyStats, setDailyStats] = useState<DailyStat[] | null>(null);
  const [corrections, setCorrections] = useState<Correction[] | null>(null);
  const [revocations, setRevocations] = useState<Revocation[] | null>(null);

  // Corrections/revocations aren't range-scoped fetches — revocations are
  // filtered to the selected range client-side below (the full list is
  // small and durable either way), corrections has no date dimension.
  useEffect(() => {
    fetch("/api/admin/corrections")
      .then((res) => res.json())
      .then((data) => setCorrections(data.corrections ?? []))
      .catch(() => setCorrections([]));

    fetch("/api/admin/revocations")
      .then((res) => res.json())
      .then((data) => setRevocations(data.revocations ?? []))
      .catch(() => setRevocations([]));
  }, []);

  // Re-fetched whenever the selected range changes — see getDailyStats()
  // in interactionLog.ts: durable per-day counters, bumped in real time as
  // each turn happens, independent of chat:interactions (which
  // deleteSession/revoke purge per-user) so a deleted or revoked session
  // doesn't retroactively change what a past day's graph showed.
  useEffect(() => {
    setDailyStats(null);
    fetch(`/api/admin/stats?days=${days}`)
      .then((res) => res.json())
      .then((data) => setDailyStats(data.stats ?? []))
      .catch(() => setDailyStats([]));
  }, [days]);

  const loading = dailyStats === null || corrections === null || revocations === null;
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  const totalSessions = dailyStats.reduce((sum, d) => sum + d.sessions, 0);
  const totalMessages = dailyStats.reduce((sum, d) => sum + d.messages, 0);
  const totalUnmatched = dailyStats.reduce((sum, d) => sum + d.unmatched, 0);
  const totalMatched = totalMessages - totalUnmatched;
  const matchRate = totalMessages > 0 ? Math.round((totalMatched / totalMessages) * 100) : null;

  const needsReedit = corrections.filter((c) => c.needsReedit).length;
  const noSuggestion = corrections.filter((c) => !c.needsReedit && !c.suggestion).length;
  const drafted = corrections.filter((c) => !c.needsReedit && !!c.suggestion).length;

  const byDay = dailyStats.map((d) => ({
    day: d.day,
    label: new Date(`${d.day}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    sessions: d.sessions,
    revoked: 0,
  }));
  const dayIndex = new Map(byDay.map((d, i) => [d.day, i]));
  for (const r of revocations) {
    const day = r.revokedAt.slice(0, 10);
    const idx = dayIndex.get(day);
    if (idx !== undefined) byDay[idx].revoked += 1;
  }
  const revokedInRange = byDay.reduce((sum, d) => sum + d.revoked, 0);

  const matchData = [
    { name: "Matched", value: totalMatched, fill: CHART_2 },
    { name: "Unmatched", value: totalUnmatched, fill: DESTRUCTIVE },
  ];

  const pipelineData = [
    { name: "No suggestion", value: noSuggestion, fill: CHART_1 },
    { name: "Drafted", value: drafted, fill: CHART_2 },
    { name: "Needs re-edit", value: needsReedit, fill: DESTRUCTIVE },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Home</h2>
          <p className="text-xs text-muted-foreground">Overview of chatbot activity and corrections review.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Range
          <select
            className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {RANGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Last {n} days
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Sessions"
          value={String(totalSessions)}
          hint={`${revokedInRange} revoked in range`}
        />
        <StatTile label="Messages" value={String(totalMessages)} />
        <StatTile
          label="Match rate"
          value={matchRate === null ? "—" : `${matchRate}%`}
          hint={`${totalUnmatched} unmatched`}
        />
        <StatTile
          label="Corrections open"
          value={String(corrections.length)}
          hint={`${noSuggestion} no suggestion · ${needsReedit} needs re-edit`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sessions &amp; revocations per day</CardTitle>
          </CardHeader>
          <CardContent>
            {totalSessions === 0 && revokedInRange === 0 ? (
              <EmptyChart label="No sessions logged yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={{ stroke: GRID }}
                    tickLine={false}
                    interval={days > 14 ? Math.ceil(days / 14) : 0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sessions" name="Sessions" fill={CHART_1} radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="revoked" name="Revoked" fill={DESTRUCTIVE} radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Matched vs. unmatched</CardTitle>
          </CardHeader>
          <CardContent>
            {totalMessages === 0 ? (
              <EmptyChart label="No messages logged yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={matchData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke={GRID} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Messages" radius={[0, 4, 4, 0]} maxBarSize={28} label={{ position: "right", fontSize: 11, fill: AXIS }}>
                    {matchData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Corrections pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {corrections.length === 0 ? (
              <EmptyChart label="No corrections logged yet." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS }} axisLine={{ stroke: GRID }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" name="Corrections" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {pipelineData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">{label}</div>
  );
}
