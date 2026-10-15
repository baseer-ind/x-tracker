"use client";

import { useState } from "react";

export default function ImportPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setMsg("Reading file...");

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setMsg(`Importing ${data.daeen?.length || 0} daeen...`);

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: text,
      });
      const result = await res.json();
      if (res.ok) {
        setStatus("done");
        setMsg(result.message);
      } else {
        setStatus("error");
        setMsg(result.error || "Import failed");
      }
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Failed to read file");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white text-2xl font-bold mb-4">X</div>
          <h1 className="text-2xl font-bold">Import Data</h1>
          <p className="text-gray-400 mt-2">Upload the JSON export to import daeen and historical stats</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {status === "done" ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-xl">✓</div>
              <p className="text-green-400">{msg}</p>
              <a href="/dashboard" className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-medium">Go to Dashboard</a>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Select the <code className="text-sky-400">import_data.json</code> file:</p>
              <input
                type="file"
                accept=".json"
                onChange={handleFile}
                disabled={status === "loading"}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-600 file:text-white hover:file:bg-sky-500 file:cursor-pointer disabled:opacity-50"
              />
              {msg && (
                <p className={`text-sm ${status === "error" ? "text-red-400" : "text-gray-400"}`}>{msg}</p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600">
          You must be logged in as admin to import data
        </p>
      </div>
    </div>
  );
}
