import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const sql = getDb();

  const rows = await sql`SELECT * FROM daeen WHERE id = ${id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stats = await sql`
    SELECT id, daee_id, to_char(month, 'YYYY-MM-DD') AS month,
      followers::int AS followers, following::int AS following,
      tweets::int AS tweets, impressions::int AS impressions,
      notes, recorded_by, created_at, updated_at
    FROM monthly_stats WHERE daee_id = ${id} ORDER BY month DESC`;

  return NextResponse.json({ daee: rows[0], stats });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const sql = getDb();
  const body = await req.json();
  const { name, twitter_handle, email, mobile, halqa, status } = body;

  const handle = twitter_handle?.replace(/^@/, "");
  const rows = await sql`
    UPDATE daeen SET
      name = COALESCE(${name}, name),
      twitter_handle = COALESCE(${handle}, twitter_handle),
      email = ${email ?? null},
      mobile = ${mobile ?? null},
      halqa = ${halqa ?? null},
      status = COALESCE(${status}, status),
      updated_at = NOW()
    WHERE id = ${id} RETURNING *`;

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const sql = getDb();

  const rows = await sql`DELETE FROM daeen WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
