import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByUsername, listUsers } from "@/lib/db";
import {
  hashPassword,
  normalizeUsername,
  requireAdmin,
  validatePassword,
  validateUsername,
} from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { username, password, is_admin } = await request.json();

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
    isAdmin: Boolean(is_admin),
  });

  return NextResponse.json({ user });
}
