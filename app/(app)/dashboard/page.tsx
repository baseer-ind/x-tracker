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

interface MonthOverview {
  month: string;
  daeen_count: number;
  total_followers: number;
  total_following: number;
  total_tweets: number;
  total_impressions: number;
}

type SortField = "name" | "followers" | "tweets" | "impressions" | "f_change" | "t_change";

export default function DashboardPage() {
  const [daeen, setDaeen] = useState<Daee[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStat[]>([]);
  const [overview, setOverview] = useState<MonthOverview[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"current" | "progress">("current");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    Promise.all([
      apiFetch<Daee[]>("/api/daeen"),
      apiFetch<string[]>("/api/stats/months"),
      apiFetch<MonthOverview[]>("/api/stats/overview"),
    ]).then(([d, m, o]) => {
      setDaeen(d);
      setMonths(m);
      setOverview(o);
      const month = m.length > 0 ? m[0] : currentMonthStr();
      setSelectedMonth(month);
      return apiFetch<MonthStat[]>(`/api/stats?month=${month}`);
    }).then(setMonthStats)
      .finally(() => setLoading(false));
  }, []);

  function changeMonth(m: string) {
    setSelectedMonth(m);
    apiFetch<MonthStat[]>(`/api/stats?month=${m}`).then(setMonthStats);
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const sortedStats = [...monthStats].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name": return dir * a.daee_name.localeCompare(b.daee_name);
      case "followers": return dir * (a.followers - b.followers);
      case "tweets": return dir * (a.tweets - b.tweets);
      case "impressions": return dir * (a.impressions - b.impressions);
      case "f_change": return dir * ((delta(a.followers, a.prev_stats?.followers) ?? 0) - (delta(b.followers, b.prev_stats?.followers) ?? 0));
      case "t_change": return dir * ((delta(a.tweets, a.prev_stats?.tweets) ?? 0) - (delta(b.tweets, b.prev_stats?.tweets) ?? 0));
      default: return 0;
    }
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  const active = daeen.filter((d) => d.status === "active");
  const inactive = daeen.filter((d) => d.status !== "active");

  const totalFollowers = monthStats.reduce((sum, s) => sum + s.followers, 0);
  const totalTweets = monthStats.reduce((sum, s) => sum + s.tweets, 0);
  const totalImpressions = monthStats.reduce((sum, s) => sum + s.impressions, 0);
  const newFollowers = monthStats.reduce((sum, s) => sum + (delta(s.followers, s.prev_stats?.followers) ?? 0), 0);
  const totalFollowing = monthStats.reduce((sum, s) => sum + s.following, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("current")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "current" ? "bg-sky-600/20 text-sky-400" : "text-gray-400 hover:text-white"}`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setTab("progress")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "progress" ? "bg-sky-600/20 text-sky-400" : "text-gray-400 hover:text-white"}`}
          >
            Progress History
          </button>
        </div>
      </div>

      {tab === "current" ? (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => changeMonth(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300"
            >
              {months.map((m) => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
              {months.length === 0 && <option value={currentMonthStr()}>{formatMonth(currentMonthStr())}</option>}
            </select>
            <span className="text-xs text-gray-500">{monthStats.length} daeen recorded</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Active Daeen" value={active.length} sub={`${daeen.length} total`} />
            <StatCard label="Total Followers" value={totalFollowers} sub={`${newFollowers >= 0 ? "+" : ""}${newFollowers} from prev`} color="sky" />
            <StatCard label="Total Following" value={totalFollowing} />
            <StatCard label="Total Tweets" value={totalTweets} />
            <StatCard label="Impressions" value={totalImpressions} color="emerald" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <DaeenList title="Active Daeen" daeen={active} color="green" />
            <DaeenList title="Inactive Daeen" daeen={inactive} color="gray" />
          </div>

          {sortedStats.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{formatMonth(selectedMonth)} Stats</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-gray-400">
                      <SortHeader label="Daee" field="name" current={sortBy} dir={sortDir} onSort={toggleSort} align="left" />
                      <SortHeader label="Followers" field="followers" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Change" field="f_change" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <th className="text-right px-4 py-3 font-medium">Following</th>
                      <SortHeader label="Tweets" field="tweets" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Change" field="t_change" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Impressions" field="impressions" current={sortBy} dir={sortDir} onSort={toggleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sortedStats.map((s) => {
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
                          <td className="text-right px-4 py-2.5 tabular-nums"><DeltaBadge value={fDelta} /></td>
                          <td className="text-right px-4 py-2.5 tabular-nums">{s.following.toLocaleString()}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums">{s.tweets.toLocaleString()}</td>
                          <td className="text-right px-4 py-2.5 tabular-nums"><DeltaBadge value={tDelta} /></td>
                          <td className="text-right px-4 py-2.5 tabular-nums">{s.impressions.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-900/50 font-semibold text-gray-300">
                      <td className="px-4 py-2.5">Total ({sortedStats.length})</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{totalFollowers.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums"><DeltaBadge value={newFollowers} /></td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{totalFollowing.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{totalTweets.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">
                        <DeltaBadge value={monthStats.reduce((sum, s) => sum + (delta(s.tweets, s.prev_stats?.tweets) ?? 0), 0)} />
                      </td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{totalImpressions.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <ProgressView overview={overview} />
      )}
    </div>
  );
}

function ProgressView({ overview }: { overview: MonthOverview[] }) {
  if (overview.length === 0) return <p className="text-gray-500">No historical data yet</p>;

  const maxFollowers = Math.max(...overview.map((o) => o.total_followers));
  const maxTweets = Math.max(...overview.map((o) => o.total_tweets));
  const maxImpressions = Math.max(...overview.map((o) => Number(o.total_impressions)));

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <MiniChart data={overview} field="total_followers" label="Followers Growth" max={maxFollowers} color="sky" />
        <MiniChart data={overview} field="total_tweets" label="Tweets Growth" max={maxTweets} color="purple" />
        <MiniChart data={overview} field="total_impressions" label="Impressions Growth" max={maxImpressions} color="emerald" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Monthly Totals</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Month</th>
                <th className="text-right px-4 py-3 font-medium">Daeen</th>
                <th className="text-right px-4 py-3 font-medium">Followers</th>
                <th className="text-right px-4 py-3 font-medium">+/-</th>
                <th className="text-right px-4 py-3 font-medium">Following</th>
                <th className="text-right px-4 py-3 font-medium">Tweets</th>
                <th className="text-right px-4 py-3 font-medium">+/-</th>
                <th className="text-right px-4 py-3 font-medium">Impressions</th>
                <th className="text-right px-4 py-3 font-medium">+/-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[...overview].reverse().map((o, i, arr) => {
                const prev = arr[i + 1];
                const fD = prev ? o.total_followers - prev.total_followers : null;
                const tD = prev ? o.total_tweets - prev.total_tweets : null;
                const iD = prev ? Number(o.total_impressions) - Number(prev.total_impressions) : null;
                return (
                  <tr key={o.month} className="hover:bg-gray-900/50">
                    <td className="px-4 py-2.5 font-medium">{formatMonth(o.month)}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{o.daeen_count}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{o.total_followers.toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums"><DeltaBadge value={fD} /></td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{o.total_following.toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{o.total_tweets.toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums"><DeltaBadge value={tD} /></td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{Number(o.total_impressions).toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums"><DeltaBadge value={iD} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data, field, label, max, color }: {
  data: MonthOverview[];
  field: keyof MonthOverview;
  label: string;
  max: number;
  color: string;
}) {
  const barColor = color === "sky" ? "bg-sky-500" : color === "purple" ? "bg-purple-500" : "bg-emerald-500";
  const textColor = color === "sky" ? "text-sky-400" : color === "purple" ? "text-purple-400" : "text-emerald-400";
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const change = prev ? Number(latest[field]) - Number(prev[field]) : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        {change !== null && <DeltaBadge value={change} />}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${textColor}`}>
        {Number(latest[field]).toLocaleString()}
      </p>
      <div className="flex items-end gap-[2px] mt-3 h-16">
        {data.map((d) => {
          const h = max > 0 ? (Number(d[field]) / max) * 100 : 0;
          return (
            <div
              key={d.month}
              className={`${barColor} rounded-t opacity-70 hover:opacity-100 transition-opacity flex-1 min-w-[3px]`}
              style={{ height: `${Math.max(h, 2)}%` }}
              title={`${formatMonth(d.month)}: ${Number(d[field]).toLocaleString()}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">{data.length > 0 ? formatMonth(data[0].month) : ""}</span>
        <span className="text-[10px] text-gray-600">{data.length > 0 ? formatMonth(data[data.length - 1].month) : ""}</span>
      </div>
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

function SortHeader({ label, field, current, dir, onSort, align = "right" }: {
  label: string; field: SortField; current: SortField; dir: "asc" | "desc";
  onSort: (f: SortField) => void; align?: "left" | "right";
}) {
  const active = current === field;
  return (
    <th
      className={`${align === "left" ? "text-left" : "text-right"} px-4 py-3 font-medium cursor-pointer hover:text-white select-none ${active ? "text-sky-400" : ""}`}
      onClick={() => onSort(field)}
    >
      {label} {active ? (dir === "asc" ? "↑" : "↓") : ""}
    </th>
  );
}
