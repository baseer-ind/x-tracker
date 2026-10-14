import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
};

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: String(user.id), email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET());
    return {
      id: Number(payload.sub),
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getUser(): Promise<AuthUser | null> {
  const c = await cookies();
  const token = c.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
