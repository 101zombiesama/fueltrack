import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "./types";
import { getUserById } from "./db";

const COOKIE_NAME = "ft_session";
const SESSION_DAYS = 30;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a string of at least 32 characters"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ uid: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.uid !== "number") return null;
    return { uid: payload.uid };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number) {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await getUserById(session.uid);
  return user ?? null;
}

/** Throws a 401-shaped Response if not signed in. Use inside route handlers. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.is_admin) {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

const USERNAME_RE = /^[a-z][a-z0-9_-]{2,31}$/;

export function validateUsername(username: string): string | null {
  if (typeof username !== "string") return "Username is required";
  const normalized = username.trim().toLowerCase();
  if (!USERNAME_RE.test(normalized)) {
    return "Username must be 3-32 characters, lowercase letters, numbers, '_' or '-', starting with a letter";
  }
  return null;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validatePassword(password: string): string | null {
  if (typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 200) return "Password is too long";
  return null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
