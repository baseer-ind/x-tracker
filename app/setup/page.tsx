"use client";

import { useState } from "react";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [dbStatus, setDbStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [dbMsg, setDbMsg] = useState("");
  const [userStatus, setUserStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [userMsg, setUserMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function initDb() {
    setDbStatus("loading");
    try {
      const res = await fetch("/api/init-db", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDbStatus("done");
        setDbMsg(data.message || "Tables created successfully!");
        setStep(2);
      } else {
        setDbStatus("error");
        setDbMsg(data.error || "Something went wrong");
      }
    } catch {
      setDbStatus("error");
      setDbMsg("Network error — check your connection");
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !name) return;
    setUserStatus("loading");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserStatus("done");
        setUserMsg(`Admin account created for ${data.email}! Redirecting to login...`);
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else {
        setUserStatus("error");
        setUserMsg(data.error || "Something went wrong");
      }
    } catch {
      setUserStatus("error");
      setUserMsg("Network error — check your connection");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white text-2xl font-bold mb-4">
            X
          </div>
          <h1 className="text-2xl font-bold">X Activity Tracker Setup</h1>
          <p className="text-gray-400 mt-2">First-time setup — takes 30 seconds</p>
        </div>

        {/* Step 1: Init DB */}
        <div className={`rounded-xl border p-6 ${step === 1 ? "border-sky-600 bg-gray-900" : "border-gray-800 bg-gray-900/50"}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              dbStatus === "done" ? "bg-green-600" : step === 1 ? "bg-sky-600" : "bg-gray-700"
            }`}>
              {dbStatus === "done" ? "✓" : "1"}
            </span>
            <h2 className="text-lg font-semibold">Create Database Tables</h2>
          </div>
          {step === 1 && dbStatus !== "done" && (
            <div>
              <p className="text-gray-400 text-sm mb-4">
                This creates the required tables (users, daeen, monthly_stats) in your Neon database.
              </p>
              <button
                onClick={initDb}
                disabled={dbStatus === "loading"}
                className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 font-medium transition-colors"
              >
                {dbStatus === "loading" ? "Creating tables..." : "Create Tables"}
              </button>
            </div>
          )}
          {dbMsg && (
            <p className={`mt-3 text-sm ${dbStatus === "error" ? "text-red-400" : "text-green-400"}`}>{dbMsg}</p>
          )}
        </div>

        {/* Step 2: Create Admin */}
        <div className={`rounded-xl border p-6 ${step === 2 ? "border-sky-600 bg-gray-900" : "border-gray-800 bg-gray-900/50"}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              userStatus === "done" ? "bg-green-600" : step === 2 ? "bg-sky-600" : "bg-gray-700"
            }`}>
              {userStatus === "done" ? "✓" : "2"}
            </span>
            <h2 className="text-lg font-semibold">Create Admin Account</h2>
          </div>
          {step === 2 && userStatus !== "done" && (
            <form onSubmit={createAdmin} className="space-y-3">
              <p className="text-gray-400 text-sm mb-2">
                Create the first admin user to log in with.
              </p>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-sky-500 focus:outline-none text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-sky-500 focus:outline-none text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-sky-500 focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={userStatus === "loading"}
                className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 font-medium transition-colors"
              >
                {userStatus === "loading" ? "Creating account..." : "Create Admin Account"}
              </button>
            </form>
          )}
          {userMsg && (
            <p className={`mt-3 text-sm ${userStatus === "error" ? "text-red-400" : "text-green-400"}`}>{userMsg}</p>
          )}
          {step === 1 && (
            <p className="text-gray-500 text-sm">Complete Step 1 first</p>
          )}
        </div>
      </div>
    </div>
  );
}
