import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  await requireUser();
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let rows;
  if (status && status !== "all") {
    rows = await sql`
      SELECT d.*,
        (SELECT row_to_json(s) FROM (
          SELECT followers::int, following::int, tweets::int, impressions::int, to_char(month, 'YYYY-MM-DD') AS month
          FROM monthly_stats WHERE daee_id = d.id ORDER BY month DESC LIMIT 1
        ) s) AS latest_stats
      FROM daeen d WHERE d.status = ${status} ORDER BY d.name`;
  } else {
    rows = await sql`
      SELECT d.*,
        (SELECT row_to_json(s) FROM (
          SELECT followers::int, following::int, tweets::int, impressions::int, to_char(month, 'YYYY-MM-DD') AS month
          FROM monthly_stats WHERE daee_id = d.id ORDER BY month DESC LIMIT 1
        ) s) AS latest_stats
      FROM daeen d ORDER BY d.name`;
  }
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await requireUser();
  const sql = getDb();
  const body = await req.json();
  const { name, twitter_handle, email, mobile, halqa, status } = body;

  if (!name || !twitter_handle) {
    return NextResponse.json({ error: "Name and Twitter handle are required" }, { status: 400 });
  }

  const handle = twitter_handle.replace(/^@/, "");
  const rows = await sql`
    INSERT INTO daeen (name, twitter_handle, email, mobile, halqa, status)
    VALUES (${name}, ${handle}, ${email || null}, ${mobile || null}, ${halqa || null}, ${status || "active"})
    RETURNING *`;
  return NextResponse.json(rows[0], { status: 201 });
}
