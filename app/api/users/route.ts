import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const sql = getDb();
  const rows = await sql`SELECT id, email, name, role, created_at FROM users ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const sql = getDb();
  const { email, password, name, role } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const rows = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email}, ${hash}, ${name}, ${role || "editor"})
    RETURNING id, email, name, role, created_at`;

  return NextResponse.json(rows[0], { status: 201 });
}
