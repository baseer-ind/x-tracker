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

type SortField = "name" | "followers" | "following" | "tweets" | "impressions" | "f_change" | "t_change";

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
      case "following": return dir * (a.following - b.following);
      case "tweets": return dir * (a.tweets - b.tweets);
      case "impressions": return dir * (a.impressions - b.impressions);
      case "f_change": return dir * ((delta(a.followers, a.prev_stats?.followers) ?? 0) - (delta(b.followers, b.prev_stats?.followers) ?? 0));
      case "t_change": return dir * ((delta(a.tweets, a.prev_stats?.tweets) ?? 0) - (delta(b.tweets, b.prev_stats?.tweets) ?? 0));
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading dashboard...
        </div>
      </div>
    );
  }

  const active = daeen.filter((d) => d.status === "active");
  const inactive = daeen.filter((d) => d.status !== "active");

  const totalFollowers = monthStats.reduce((sum, s) => sum + Number(s.followers), 0);
  const totalTweets = monthStats.reduce((sum, s) => sum + Number(s.tweets), 0);
  const totalImpressions = monthStats.reduce((sum, s) => sum + Number(s.impressions), 0);
  const newFollowers = monthStats.reduce((sum, s) => sum + (delta(Number(s.followers), s.prev_stats ? Number(s.prev_stats.followers) : null) ?? 0), 0);
  const totalFollowing = monthStats.reduce((sum, s) => sum + Number(s.following), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{daeen.length} daeen tracked across {months.length} months</p>
        </div>
        <div className="flex items-center bg-gray-900/60 rounded-xl p-1 border border-gray-800/60">
          <button
            onClick={() => setTab("current")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "current"
                ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setTab("progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "progress"
                ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Progress History
          </button>
        </div>
      </div>

      {tab === "current" ? (
        <>
          {/* Month Selector */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => changeMonth(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
                {months.length === 0 && <option value={currentMonthStr()}>{formatMonth(currentMonthStr())}</option>}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-xs text-gray-400">{monthStats.length} daeen recorded this month</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Active Daeen"
              value={active.length}
              sub={`${daeen.length} total`}
              icon={<IconUsers />}
              accent="violet"
            />
            <StatCard
              label="Followers"
              value={totalFollowers}
              change={newFollowers}
              icon={<IconFollowers />}
              accent="sky"
            />
            <StatCard
              label="Following"
              value={totalFollowing}
              icon={<IconFollowing />}
              accent="slate"
            />
            <StatCard
              label="Tweets"
              value={totalTweets}
              icon={<IconTweets />}
              accent="amber"
            />
            <StatCard
              label="Impressions"
              value={totalImpressions}
              icon={<IconImpressions />}
              accent="emerald"
            />
          </div>

          {/* Daeen Lists */}
          <div className="grid lg:grid-cols-2 gap-6">
            <DaeenList title="Active Daeen" daeen={active} variant="active" />
            <DaeenList title="Inactive Daeen" daeen={inactive} variant="inactive" />
          </div>

          {/* Stats Table */}
          {sortedStats.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{formatMonth(selectedMonth)} — Detailed Stats</h2>
                <span className="text-xs text-gray-500">{sortedStats.length} entries</span>
              </div>
              <div className="bg-gray-900/40 rounded-2xl border border-gray-800/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800/80">
                        <SortHeader label="Daee" field="name" current={sortBy} dir={sortDir} onSort={toggleSort} align="left" />
                        <SortHeader label="Followers" field="followers" current={sortBy} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="+/−" field="f_change" current={sortBy} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Following" field="following" current={sortBy} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Tweets" field="tweets" current={sortBy} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="+/−" field="t_change" current={sortBy} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Impressions" field="impressions" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStats.map((s, i) => {
                        const fDelta = delta(Number(s.followers), s.prev_stats ? Number(s.prev_stats.followers) : null);
                        const tDelta = delta(Number(s.tweets), s.prev_stats ? Number(s.prev_stats.tweets) : null);
                        return (
                          <tr key={s.daee_id} className={`transition-colors hover:bg-gray-800/40 ${i % 2 === 0 ? "bg-transparent" : "bg-gray-900/20"}`}>
                            <td className="px-4 py-3">
                              <Link href={`/daeen/${s.daee_id}`} className="group">
                                <span className="font-medium text-white group-hover:text-sky-400 transition-colors">{s.daee_name}</span>
                                <span className="text-gray-600 ml-2 text-xs">@{s.twitter_handle}</span>
                              </Link>
                            </td>
                            <td className="text-right px-4 py-3 tabular-nums text-gray-200">{Number(s.followers).toLocaleString()}</td>
                            <td className="text-right px-4 py-3 tabular-nums"><DeltaBadge value={fDelta} /></td>
                            <td className="text-right px-4 py-3 tabular-nums text-gray-400">{Number(s.following).toLocaleString()}</td>
                            <td className="text-right px-4 py-3 tabular-nums text-gray-200">{Number(s.tweets).toLocaleString()}</td>
                            <td className="text-right px-4 py-3 tabular-nums"><DeltaBadge value={tDelta} /></td>
                            <td className="text-right px-4 py-3 tabular-nums text-gray-200">{Number(s.impressions).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-700 bg-gray-900/60">
                        <td className="px-4 py-3 font-semibold text-white">Total ({sortedStats.length})</td>
                        <td className="text-right px-4 py-3 tabular-nums font-semibold text-white">{totalFollowers.toLocaleString()}</td>
                        <td className="text-right px-4 py-3 tabular-nums font-semibold"><DeltaBadge value={newFollowers} /></td>
                        <td className="text-right px-4 py-3 tabular-nums font-semibold text-gray-300">{totalFollowing.toLocaleString()}</td>
                        <td className="text-right px-4 py-3 tabular-nums font-semibold text-white">{totalTweets.toLocaleString()}</td>
                        <td className="text-right px-4 py-3 tabular-nums font-semibold">
                          <DeltaBadge value={monthStats.reduce((sum, s) => sum + (delta(Number(s.tweets), s.prev_stats ? Number(s.prev_stats.tweets) : null) ?? 0), 0)} />
                        </td>
                        <td className="text-right px-4 py-3 tabular-nums font-semibold text-white">{totalImpressions.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
  if (overview.length === 0) return <p className="text-gray-500 text-center py-12">No historical data yet</p>;

  const maxFollowers = Math.max(...overview.map((o) => Number(o.total_followers)));
  const maxTweets = Math.max(...overview.map((o) => Number(o.total_tweets)));
  const maxImpressions = Math.max(...overview.map((o) => Number(o.total_impressions)));

  return (
    <div className="space-y-8">
      {/* Growth Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <MiniChart data={overview} field="total_followers" label="Followers Growth" max={maxFollowers} color="sky" />
        <MiniChart data={overview} field="total_tweets" label="Tweets Growth" max={maxTweets} color="amber" />
        <MiniChart data={overview} field="total_impressions" label="Impressions Growth" max={maxImpressions} color="emerald" />
      </div>

      {/* Monthly Totals Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Monthly Totals</h2>
        <div className="bg-gray-900/40 rounded-2xl border border-gray-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800/80">
                  <th className="text-left px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">Month</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">Daeen</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">Followers</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">+/−</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">Following</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">Tweets</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">+/−</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">Impressions</th>
                  <th className="text-right px-4 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wider">+/−</th>
                </tr>
              </thead>
              <tbody>
                {[...overview].reverse().map((o, i, arr) => {
                  const prev = arr[i + 1];
                  const fD = prev ? Number(o.total_followers) - Number(prev.total_followers) : null;
                  const tD = prev ? Number(o.total_tweets) - Number(prev.total_tweets) : null;
                  const iD = prev ? Number(o.total_impressions) - Number(prev.total_impressions) : null;
                  return (
                    <tr key={o.month} className={`transition-colors hover:bg-gray-800/40 ${i % 2 === 0 ? "bg-transparent" : "bg-gray-900/20"}`}>
                      <td className="px-4 py-3 font-medium text-white">{formatMonth(o.month)}</td>
                      <td className="text-right px-4 py-3 tabular-nums text-gray-300">{o.daeen_count}</td>
                      <td className="text-right px-4 py-3 tabular-nums text-gray-200">{Number(o.total_followers).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 tabular-nums"><DeltaBadge value={fD} /></td>
                      <td className="text-right px-4 py-3 tabular-nums text-gray-400">{Number(o.total_following).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 tabular-nums text-gray-200">{Number(o.total_tweets).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 tabular-nums"><DeltaBadge value={tD} /></td>
                      <td className="text-right px-4 py-3 tabular-nums text-gray-200">{Number(o.total_impressions).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 tabular-nums"><DeltaBadge value={iD} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
  const barColor = color === "sky" ? "bg-sky-500" : color === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const barHover = color === "sky" ? "hover:bg-sky-400" : color === "amber" ? "hover:bg-amber-400" : "hover:bg-emerald-400";
  const textColor = color === "sky" ? "text-sky-400" : color === "amber" ? "text-amber-400" : "text-emerald-400";
  const bgGlow = color === "sky" ? "shadow-sky-500/5" : color === "amber" ? "shadow-amber-500/5" : "shadow-emerald-500/5";
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const change = prev ? Number(latest[field]) - Number(prev[field]) : null;

  return (
    <div className={`bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 shadow-lg ${bgGlow}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        {change !== null && <DeltaBadge value={change} />}
      </div>
      <p className={`text-3xl font-bold tabular-nums ${textColor} mt-1`}>
        {Number(latest[field]).toLocaleString()}
      </p>
      <div className="flex items-end gap-[3px] mt-4 h-20">
        {data.map((d) => {
          const h = max > 0 ? (Number(d[field]) / max) * 100 : 0;
          return (
            <div
              key={d.month}
              className={`${barColor} ${barHover} rounded-t-sm opacity-60 hover:opacity-100 transition-all flex-1 min-w-[3px] cursor-default`}
              style={{ height: `${Math.max(h, 3)}%` }}
              title={`${formatMonth(d.month)}: ${Number(d[field]).toLocaleString()}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-gray-600">{data.length > 0 ? formatMonth(data[0].month) : ""}</span>
        <span className="text-[10px] text-gray-600">{data.length > 0 ? formatMonth(data[data.length - 1].month) : ""}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, change, icon, accent }: {
  label: string;
  value: number;
  sub?: string;
  change?: number;
  icon: React.ReactNode;
  accent: string;
}) {
  const colors: Record<string, { text: string; bg: string; border: string }> = {
    sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    slate: { text: "text-gray-300", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  };
  const c = colors[accent] || colors.slate;

  return (
    <div className="bg-gray-900/60 rounded-2xl border border-gray-800/60 p-4 hover:border-gray-700/60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        {change !== undefined && <DeltaBadge value={change} />}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${c.text}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function DaeenList({ title, daeen, variant }: { title: string; daeen: Daee[]; variant: "active" | "inactive" }) {
  const dotColor = variant === "active" ? "bg-green-500" : "bg-gray-600";
  const headerBg = variant === "active" ? "bg-green-500/5" : "bg-gray-800/30";

  return (
    <div className="bg-gray-900/40 rounded-2xl border border-gray-800/60 overflow-hidden">
      <div className={`px-5 py-3.5 border-b border-gray-800/60 ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
          </div>
          <span className="text-xs text-gray-500 font-medium tabular-nums">{daeen.length}</span>
        </div>
      </div>
      {daeen.length === 0 ? (
        <p className="text-gray-600 text-sm p-5">None</p>
      ) : (
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-800/40">
          {daeen.map((d) => (
            <li key={d.id}>
              <Link
                href={`/daeen/${d.id}`}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-800/30 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                  <span className="text-sm text-gray-200 group-hover:text-sky-400 transition-colors truncate">{d.name}</span>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0 ml-3">@{d.twitter_handle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-700">—</span>;
  if (value > 0) return <span className="text-emerald-400 font-medium">+{value.toLocaleString()}</span>;
  if (value < 0) return <span className="text-red-400 font-medium">{value.toLocaleString()}</span>;
  return <span className="text-gray-600">0</span>;
}

function SortHeader({ label, field, current, dir, onSort, align = "right" }: {
  label: string; field: SortField; current: SortField; dir: "asc" | "desc";
  onSort: (f: SortField) => void; align?: "left" | "right";
}) {
  const active = current === field;
  return (
    <th
      className={`${align === "left" ? "text-left" : "text-right"} px-4 py-3.5 font-medium text-xs uppercase tracking-wider cursor-pointer select-none transition-colors ${
        active ? "text-sky-400" : "text-gray-400 hover:text-gray-200"
      }`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {align === "right" && active && <SortArrow dir={dir} />}
        {label}
        {align === "left" && active && <SortArrow dir={dir} />}
      </span>
    </th>
  );
}

function SortArrow({ dir }: { dir: "asc" | "desc" }) {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
      {dir === "asc" ? (
        <path d="M7 3L12 9H2L7 3Z" />
      ) : (
        <path d="M7 11L2 5H12L7 11Z" />
      )}
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconFollowers() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function IconFollowing() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  );
}

function IconTweets() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function IconImpressions() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
