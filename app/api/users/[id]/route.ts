import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const sql = getDb();
  const { name, email, role, password } = await req.json();

  if (password) {
    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      UPDATE users SET name = ${name}, email = ${email}, role = ${role}, password_hash = ${hash}
      WHERE id = ${id} RETURNING id, email, name, role, created_at`;
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  }

  const rows = await sql`
    UPDATE users SET name = ${name}, email = ${email}, role = ${role}
    WHERE id = ${id} RETURNING id, email, name, role, created_at`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  if (Number(id) === user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
