"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, currentMonthStr, formatMonth, delta } from "@/lib/api";

interface Daee {
  id: number;
  name: string;
  twitter_handle: string;
  status: string;
  latest_stats: {
    followers: number;
    following: number;
    tweets: number;
    impressions: number;
    month: string;
  } | null;
}

interface MonthStat {
  daee_id: number;
  daee_name: string;
  twitter_handle: string;
  daee_status: string;
  followers: number;
  following: number;
  tweets: number;
  impressions: number;
  prev_stats: { followers: number; following: number; tweets: number; impressions: number } | null;
}

export default function DashboardPage() {
  const [daeen, setDaeen] = useState<Daee[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Daee[]>("/api/daeen"),
      apiFetch<MonthStat[]>(`/api/stats?month=${currentMonthStr()}`),
    ])
      .then(([d, s]) => {
        setDaeen(d);
        setMonthStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  const active = daeen.filter((d) => d.status === "active");
  const inactive = daeen.filter((d) => d.status !== "active");

  const totalFollowers = monthStats.reduce((sum, s) => sum + s.followers, 0);
  const totalTweets = monthStats.reduce((sum, s) => sum + s.tweets, 0);
  const totalImpressions = monthStats.reduce((sum, s) => sum + s.impressions, 0);
  const newFollowers = monthStats.reduce((sum, s) => sum + (delta(s.followers, s.prev_stats?.followers) ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-gray-400">{formatMonth(currentMonthStr())}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Daeen" value={daeen.length} sub={`${active.length} active`} />
        <StatCard label="Total Followers" value={totalFollowers} sub={`+${newFollowers} this month`} color="sky" />
        <StatCard label="Total Tweets" value={totalTweets} />
        <StatCard label="Impressions" value={totalImpressions} color="emerald" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DaeenList title="Active Daeen" daeen={active} color="green" />
        <DaeenList title="Inactive Daeen" daeen={inactive} color="gray" />
      </div>

      {monthStats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">This Month&apos;s Stats</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">Daee</th>
                  <th className="text-right px-4 py-3 font-medium">Followers</th>
                  <th className="text-right px-4 py-3 font-medium">Change</th>
                  <th className="text-right px-4 py-3 font-medium">Tweets</th>
                  <th className="text-right px-4 py-3 font-medium">Change</th>
                  <th className="text-right px-4 py-3 font-medium">Impressions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {monthStats.map((s) => {
                  const fDelta = delta(s.followers, s.prev_stats?.followers);
                  const tDelta = delta(s.tweets, s.prev_stats?.tweets);
                  return (
                    <tr key={s.daee_id} className="hover:bg-gray-900/50">
                      <td className="px-4 py-2.5">
                        <Link href={`/daeen/${s.daee_id}`} className="hover:text-sky-400">
                          <span className="font-medium">{s.daee_name}</span>
                          <span className="text-gray-500 ml-2 text-xs">@{s.twitter_handle}</span>
                        </Link>
                      </td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.followers.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">
                        <DeltaBadge value={fDelta} />
                      </td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.tweets.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">
                        <DeltaBadge value={tDelta} />
                      </td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.impressions.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  const accent = color === "sky" ? "text-sky-400" : color === "emerald" ? "text-emerald-400" : "text-white";
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function DaeenList({ title, daeen, color }: { title: string; daeen: Daee[]; color: string }) {
  const dot = color === "green" ? "bg-green-500" : "bg-gray-600";
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">
        {title} <span className="text-gray-500">({daeen.length})</span>
      </h2>
      {daeen.length === 0 ? (
        <p className="text-gray-500 text-sm">None</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {daeen.map((d) => (
            <li key={d.id}>
              <Link
                href={`/daeen/${d.id}`}
                className="flex items-center gap-2 text-sm hover:text-sky-400 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span>{d.name}</span>
                <span className="text-gray-600">@{d.twitter_handle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-600">-</span>;
  if (value > 0) return <span className="text-green-400">+{value.toLocaleString()}</span>;
  if (value < 0) return <span className="text-red-400">{value.toLocaleString()}</span>;
  return <span className="text-gray-500">0</span>;
}
