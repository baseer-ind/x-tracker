import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();
  const sql = getDb();

  const rows = await sql`
    SELECT
      month,
      COUNT(DISTINCT daee_id)::int AS daeen_count,
      SUM(followers)::int AS total_followers,
      SUM(following)::int AS total_following,
      SUM(tweets)::int AS total_tweets,
      SUM(impressions)::bigint AS total_impressions
    FROM monthly_stats
    GROUP BY month
    ORDER BY month ASC`;

  return NextResponse.json(rows);
}
