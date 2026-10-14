"use client";

import { useEffect, useState } from "react";
import { apiFetch, currentMonthStr, formatMonth } from "@/lib/api";

interface Daee {
  id: number;
  name: string;
  twitter_handle: string;
  status: string;
}

interface ExistingStat {
  daee_id: number;
  followers: number;
  following: number;
  tweets: number;
  impressions: number;
}

interface StatEntry {
  daee_id: number;
  followers: string;
  following: string;
  tweets: string;
  impressions: string;
  dirty: boolean;
}

export default function TrackerPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [daeen, setDaeen] = useState<Daee[]>([]);
  const [entries, setEntries] = useState<Record<number, StatEntry>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");

  const monthDate = `${month}-01`;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<Daee[]>("/api/daeen?status=active"),
      apiFetch<ExistingStat[]>(`/api/stats?month=${monthDate}`),
    ]).then(([dList, statsList]) => {
      setDaeen(dList);
      const map: Record<number, StatEntry> = {};
      for (const d of dList) {
        const existing = statsList.find((s) => s.daee_id === d.id);
        map[d.id] = {
          daee_id: d.id,
          followers: existing?.followers?.toString() ?? "",
          following: existing?.following?.toString() ?? "",
          tweets: existing?.tweets?.toString() ?? "",
          impressions: existing?.impressions?.toString() ?? "",
          dirty: false,
        };
      }
      setEntries(map);
      setLoading(false);
    });
  }, [monthDate]);

  function updateEntry(id: number, field: keyof StatEntry, value: string) {
    setEntries((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value, dirty: true },
    }));
  }

  async function saveEntry(id: number) {
    const entry = entries[id];
    if (!entry) return;
    setSaving(id);
    try {
      await apiFetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daee_id: id,
          month: monthDate,
          followers: parseInt(entry.followers) || 0,
          following: parseInt(entry.following) || 0,
          tweets: parseInt(entry.tweets) || 0,
          impressions: parseInt(entry.impressions) || 0,
        }),
      });
      setEntries((prev) => ({ ...prev, [id]: { ...prev[id], dirty: false } }));
      setSavedMsg(`Saved ${daeen.find((d) => d.id === id)?.name}`);
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    const dirtyEntries = Object.values(entries).filter((e) => e.dirty);
    for (const entry of dirtyEntries) {
      await saveEntry(entry.daee_id);
    }
  }

  const hasDirty = Object.values(entries).some((e) => e.dirty);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Monthly Tracker</h1>
          <p className="text-sm text-gray-400">Enter stats for each daee</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
          />
          {hasDirty && (
            <button
              onClick={saveAll}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg"
            >
              Save All
            </button>
          )}
        </div>
      </div>

      {savedMsg && (
        <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-2 rounded-lg text-sm">
          {savedMsg}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : daeen.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No active daeen. Add daeen first.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400">
                <th className="text-left px-4 py-3 font-medium min-w-[140px]">Daee</th>
                <th className="px-3 py-3 font-medium w-28">Followers</th>
                <th className="px-3 py-3 font-medium w-28">Following</th>
                <th className="px-3 py-3 font-medium w-28">Tweets</th>
                <th className="px-3 py-3 font-medium w-32">Impressions</th>
                <th className="px-3 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {daeen.map((d) => {
                const entry = entries[d.id];
                if (!entry) return null;
                return (
                  <tr key={d.id} className={entry.dirty ? "bg-sky-950/20" : ""}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-gray-500">@{d.twitter_handle}</p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.followers}
                        onChange={(e) => updateEntry(d.id, "followers", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white text-right tabular-nums"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.following}
                        onChange={(e) => updateEntry(d.id, "following", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white text-right tabular-nums"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.tweets}
                        onChange={(e) => updateEntry(d.id, "tweets", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white text-right tabular-nums"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.impressions}
                        onChange={(e) => updateEntry(d.id, "impressions", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white text-right tabular-nums"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {entry.dirty && (
                        <button
                          onClick={() => saveEntry(d.id)}
                          disabled={saving === d.id}
                          className="text-xs text-sky-400 hover:text-sky-300 disabled:text-gray-600"
                        >
                          {saving === d.id ? "..." : "Save"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
