"use client";

import { useState } from "react";
import { apiFetch, formatMonth } from "@/lib/api";

interface MonthStat {
  daee_id: number;
  daee_name: string;
  twitter_handle: string;
  followers: number;
  following: number;
  tweets: number;
  impressions: number;
  prev_stats: { followers: number; following: number; tweets: number; impressions: number } | null;
}

export default function ReportsPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const stats = await apiFetch<MonthStat[]>(`/api/stats?month=${month}-01`);

      if (stats.length === 0) {
        alert("No data for this month");
        return;
      }

      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape" });
      const monthLabel = formatMonth(`${month}-01`);

      doc.setFontSize(18);
      doc.text("X Activity Report", 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Month: ${monthLabel}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

      const totalFollowers = stats.reduce((s, r) => s + r.followers, 0);
      const totalTweets = stats.reduce((s, r) => s + r.tweets, 0);
      const totalImpressions = stats.reduce((s, r) => s + r.impressions, 0);
      const newFollowers = stats.reduce((s, r) => {
        const prev = r.prev_stats?.followers;
        return s + (prev != null ? r.followers - prev : 0);
      }, 0);

      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`Total Daeen: ${stats.length}   |   Followers: ${totalFollowers.toLocaleString()}   |   New Followers: +${newFollowers.toLocaleString()}   |   Tweets: ${totalTweets.toLocaleString()}   |   Impressions: ${totalImpressions.toLocaleString()}`, 14, 42);

      const rows = stats.map((s) => {
        const fDelta = s.prev_stats ? s.followers - s.prev_stats.followers : "-";
        const tDelta = s.prev_stats ? s.tweets - s.prev_stats.tweets : "-";
        return [
          s.daee_name,
          `@${s.twitter_handle}`,
          s.followers.toLocaleString(),
          typeof fDelta === "number" ? (fDelta >= 0 ? `+${fDelta}` : String(fDelta)) : "-",
          s.following.toLocaleString(),
          s.tweets.toLocaleString(),
          typeof tDelta === "number" ? (tDelta >= 0 ? `+${tDelta}` : String(tDelta)) : "-",
          s.impressions.toLocaleString(),
        ];
      });

      autoTable(doc, {
        startY: 48,
        head: [["Name", "Handle", "Followers", "+/-", "Following", "Tweets", "+/-", "Impressions"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
        },
      });

      doc.save(`x-activity-report-${month}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-gray-400 text-sm">Generate a PDF report of monthly X activity</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Monthly Report</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Select month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {generating ? "Generating..." : "Download PDF Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
