import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM monthly_stats WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
