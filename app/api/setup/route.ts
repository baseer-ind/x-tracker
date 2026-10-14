import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const sql = getDb();

  const existing = await sql`SELECT count(*) as c FROM users`;
  if (Number(existing[0].c) > 0) {
    return NextResponse.json({ error: "Setup already complete. Users exist." }, { status: 400 });
  }

  const { email, password, name } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  await sql`INSERT INTO users (email, password_hash, name, role) VALUES (${email}, ${hash}, ${name}, 'admin')`;

  return NextResponse.json({ ok: true, message: "Admin user created. You can now log in." });
}
