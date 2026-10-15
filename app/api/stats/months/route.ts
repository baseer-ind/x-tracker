import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();
  const sql = getDb();

  const rows = await sql`
    SELECT DISTINCT month FROM monthly_stats ORDER BY month DESC`;

  return NextResponse.json(rows.map((r) => r.month));
}
