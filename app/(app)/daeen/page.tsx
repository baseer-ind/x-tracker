"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Daee {
  id: number;
  name: string;
  twitter_handle: string;
  email: string | null;
  mobile: string | null;
  halqa: string | null;
  status: string;
  latest_stats: {
    followers: number;
    following: number;
    tweets: number;
    impressions: number;
  } | null;
}

export default function DaeenPage() {
  const [daeen, setDaeen] = useState<Daee[]>([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", twitter_handle: "", email: "", mobile: "", halqa: "" });
  const [saving, setSaving] = useState(false);

  function loadDaeen() {
    setLoading(true);
    apiFetch<Daee[]>(`/api/daeen?status=${filter}`)
      .then(setDaeen)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadDaeen(); }, [filter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/daeen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", twitter_handle: "", email: "", mobile: "", halqa: "" });
      setShowForm(false);
      loadDaeen();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Daeen</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Daee
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">New Daee</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Twitter handle *"
              required
              value={form.twitter_handle}
              onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Halqa"
              value={form.halqa}
              onChange={(e) => setForm({ ...form, halqa: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white text-sm font-medium rounded-lg"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : daeen.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No daeen found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Handle</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Halqa</th>
                <th className="text-right px-4 py-3 font-medium">Followers</th>
                <th className="text-right px-4 py-3 font-medium">Tweets</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {daeen.map((d) => (
                <tr key={d.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/daeen/${d.id}`} className="font-medium hover:text-sky-400">{d.name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    <a href={`https://x.com/${d.twitter_handle}`} target="_blank" rel="noopener" className="hover:text-sky-400">
                      @{d.twitter_handle}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 hidden md:table-cell">{d.halqa || "-"}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{d.latest_stats?.followers?.toLocaleString() ?? "-"}</td>
                  <td className="text-right px-4 py-2.5 tabular-nums">{d.latest_stats?.tweets?.toLocaleString() ?? "-"}</td>
                  <td className="text-center px-4 py-2.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${d.status === "active" ? "bg-green-500" : "bg-gray-600"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
