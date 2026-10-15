import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

interface ImportDaee {
  name: string;
  twitter_handle: string;
  email?: string;
  mobile?: string;
  halqa?: string;
  status?: string;
  stats: Array<{
    month: string;
    followers: number;
    following: number;
    tweets: number;
    impressions: number;
  }>;
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { daeen }: { daeen: ImportDaee[] } = await req.json();
  if (!daeen || !Array.isArray(daeen)) {
    return NextResponse.json({ error: "Expected { daeen: [...] }" }, { status: 400 });
  }

  const sql = getDb();
  let imported = 0;
  let statsImported = 0;

  for (const d of daeen) {
    const handle = d.twitter_handle.replace(/^@/, "");

    const existing = await sql`SELECT id FROM daeen WHERE twitter_handle = ${handle}`;
    let daeeId: number;

    if (existing.length > 0) {
      daeeId = existing[0].id;
      await sql`
        UPDATE daeen SET
          email = COALESCE(${d.email || null}, email),
          mobile = COALESCE(${d.mobile || null}, mobile),
          halqa = COALESCE(${d.halqa || null}, halqa),
          updated_at = NOW()
        WHERE id = ${daeeId}`;
    } else {
      const rows = await sql`
        INSERT INTO daeen (name, twitter_handle, email, mobile, halqa, status)
        VALUES (${d.name}, ${handle}, ${d.email || null}, ${d.mobile || null}, ${d.halqa || null}, ${d.status || "active"})
        RETURNING id`;
      daeeId = rows[0].id;
      imported++;
    }

    for (const s of d.stats) {
      await sql`
        INSERT INTO monthly_stats (daee_id, month, followers, following, tweets, impressions, recorded_by)
        VALUES (${daeeId}, ${s.month}, ${s.followers}, ${s.following}, ${s.tweets}, ${s.impressions}, ${user.id})
        ON CONFLICT (daee_id, month) DO UPDATE SET
          followers = EXCLUDED.followers,
          following = EXCLUDED.following,
          tweets = EXCLUDED.tweets,
          impressions = EXCLUDED.impressions,
          recorded_by = EXCLUDED.recorded_by,
          updated_at = NOW()`;
      statsImported++;
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Imported ${imported} new daeen, ${statsImported} stat records`,
    daeen_imported: imported,
    stats_imported: statsImported,
  });
}
