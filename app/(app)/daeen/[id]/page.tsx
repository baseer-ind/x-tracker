"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formatMonth, delta } from "@/lib/api";

interface Daee {
  id: number;
  name: string;
  twitter_handle: string;
  email: string | null;
  mobile: string | null;
  halqa: string | null;
  status: string;
}

interface Stat {
  id: number;
  month: string;
  followers: number;
  following: number;
  tweets: number;
  impressions: number;
}

export default function DaeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [daee, setDaee] = useState<Daee | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Daee>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ daee: Daee; stats: Stat[] }>(`/api/daeen/${id}`).then((d) => {
      setDaee(d.daee);
      setStats(d.stats);
      setForm(d.daee);
    });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiFetch<Daee>(`/api/daeen/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setDaee(updated);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this daee and all their stats?")) return;
    await apiFetch(`/api/daeen/${id}`, { method: "DELETE" });
    router.push("/daeen");
  }

  if (!daee) return <div className="text-gray-500 text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/daeen")} className="text-sm text-gray-400 hover:text-white mb-1">&larr; Back to Daeen</button>
          <h1 className="text-2xl font-bold">{daee.name}</h1>
          <p className="text-gray-400 text-sm">
            <a href={`https://x.com/${daee.twitter_handle}`} target="_blank" rel="noopener" className="hover:text-sky-400">
              @{daee.twitter_handle}
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDelete} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm rounded-lg">
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={form.twitter_handle || ""} onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })} placeholder="Handle" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={form.halqa || ""} onChange={(e) => setForm({ ...form, halqa: e.target.value })} placeholder="Halqa" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-4 gap-4">
        <InfoCard label="Email" value={daee.email} />
        <InfoCard label="Mobile" value={daee.mobile} />
        <InfoCard label="Halqa" value={daee.halqa} />
        <InfoCard label="Status" value={daee.status} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Monthly History</h2>
        {stats.length === 0 ? (
          <p className="text-gray-500 text-sm">No stats recorded yet</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">Month</th>
                  <th className="text-right px-4 py-3 font-medium">Followers</th>
                  <th className="text-right px-4 py-3 font-medium">+/-</th>
                  <th className="text-right px-4 py-3 font-medium">Following</th>
                  <th className="text-right px-4 py-3 font-medium">Tweets</th>
                  <th className="text-right px-4 py-3 font-medium">+/-</th>
                  <th className="text-right px-4 py-3 font-medium">Impressions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.map((s, i) => {
                  const prev = stats[i + 1];
                  const fD = delta(s.followers, prev?.followers);
                  const tD = delta(s.tweets, prev?.tweets);
                  return (
                    <tr key={s.id} className="hover:bg-gray-900/50">
                      <td className="px-4 py-2.5 font-medium">{formatMonth(s.month)}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.followers.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums"><Delta v={fD} /></td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.following.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.tweets.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums"><Delta v={tD} /></td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{s.impressions.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm mt-1 text-white">{value || "-"}</p>
    </div>
  );
}

function Delta({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-600">-</span>;
  if (v > 0) return <span className="text-green-400">+{v.toLocaleString()}</span>;
  if (v < 0) return <span className="text-red-400">{v.toLocaleString()}</span>;
  return <span className="text-gray-500">0</span>;
}
