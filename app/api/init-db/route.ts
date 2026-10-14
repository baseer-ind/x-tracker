import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'editor',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS daeen (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      twitter_handle VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      mobile VARCHAR(100),
      halqa VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS monthly_stats (
      id SERIAL PRIMARY KEY,
      daee_id INTEGER NOT NULL REFERENCES daeen(id) ON DELETE CASCADE,
      month DATE NOT NULL,
      followers INTEGER NOT NULL DEFAULT 0,
      following INTEGER NOT NULL DEFAULT 0,
      tweets INTEGER NOT NULL DEFAULT 0,
      impressions BIGINT NOT NULL DEFAULT 0,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(daee_id, month)
    )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_monthly_stats_month ON monthly_stats(month)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_monthly_stats_daee ON monthly_stats(daee_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_daeen_status ON daeen(status)`;

  return NextResponse.json({ ok: true, message: "Database tables created" });
}
