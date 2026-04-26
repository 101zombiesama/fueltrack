import { NextRequest, NextResponse } from "next/server";
import { countUsers, createUser, getUserByUsername } from "@/lib/db";
import {
  hashPassword,
  normalizeUsername,
  setSessionCookie,
  validatePassword,
  validateUsername,
} from "@/lib/auth";

/**
 * Bootstrap signup: only succeeds when zero users exist.
 * Creates the first admin and migrates any pre-existing data to them.
 * After this point, this endpoint always returns 403 — admins create users from /settings.
 */
export async function POST(request: NextRequest) {
  if ((await countUsers()) > 0) {
    return NextResponse.json(
      { error: "Signup is disabled. Ask an admin to create your account." },
      { status: 403 }
    );
  }

  const { username, password } = await request.json();

  const usernameError = validateUsername(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const normalized = normalizeUsername(username);
  if (await getUserByUsername(normalized)) {
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    username: normalized,
    passwordHash,
    isAdmin: true,
    bootstrapAdmin: true,
  });

  await setSessionCookie(user.id);
  return NextResponse.json({ user });
}

export async function GET() {
  const usersExist = (await countUsers()) > 0;
  return NextResponse.json({ open: !usersExist });
}
