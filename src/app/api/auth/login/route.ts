import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/db";
import {
  normalizeUsername,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await getUserByUsername(normalizeUsername(username));
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      created_at: user.created_at,
    },
  });
}
