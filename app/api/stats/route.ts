import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  await requireUser();
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "month query param required (YYYY-MM-01)" }, { status: 400 });
  }

  const rows = await sql`
    SELECT ms.*, d.name AS daee_name, d.twitter_handle, d.status AS daee_status,
      (SELECT row_to_json(prev) FROM (
        SELECT followers, following, tweets, impressions
        FROM monthly_stats
        WHERE daee_id = ms.daee_id AND month < ms.month
        ORDER BY month DESC LIMIT 1
      ) prev) AS prev_stats
    FROM monthly_stats ms
    JOIN daeen d ON d.id = ms.daee_id
    WHERE ms.month = ${month}
    ORDER BY d.name`;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  const sql = getDb();
  const body = await req.json();
  const { daee_id, month, followers, following, tweets, impressions, notes } = body;

  if (!daee_id || !month) {
    return NextResponse.json({ error: "daee_id and month required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO monthly_stats (daee_id, month, followers, following, tweets, impressions, notes, recorded_by)
    VALUES (${daee_id}, ${month}, ${followers || 0}, ${following || 0}, ${tweets || 0}, ${impressions || 0}, ${notes || null}, ${user.id})
    ON CONFLICT (daee_id, month) DO UPDATE SET
      followers = EXCLUDED.followers,
      following = EXCLUDED.following,
      tweets = EXCLUDED.tweets,
      impressions = EXCLUDED.impressions,
      notes = EXCLUDED.notes,
      recorded_by = EXCLUDED.recorded_by,
      updated_at = NOW()
    RETURNING *`;

  return NextResponse.json(rows[0]);
}
