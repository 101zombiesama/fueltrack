import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  hashPassword,
  normalizeUsername,
  setSessionCookie,
  validatePassword,
  validateUsername,
  verifyPassword,
} from "@/lib/auth";
import {
  getUserByUsername,
  updatePasswordHash,
  updateUsername,
} from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newUsername, newPassword } = await request.json();

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    return NextResponse.json(
      { error: "Current password is required" },
      { status: 400 }
    );
  }

  const wantUsername = typeof newUsername === "string" && newUsername.length > 0;
  const wantPassword = typeof newPassword === "string" && newPassword.length > 0;
  if (!wantUsername && !wantPassword) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  // Re-fetch to access password hash
  const record = await getUserByUsername(user.username);
  if (!record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await verifyPassword(currentPassword, record.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 }
    );
  }

  let updated = user;

  if (wantUsername) {
    const error = validateUsername(newUsername);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const normalized = normalizeUsername(newUsername);
    if (normalized !== user.username) {
      const taken = await getUserByUsername(normalized);
      if (taken) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
      const next = await updateUsername(user.id, normalized);
      if (next) updated = next;
    }
  }

  if (wantPassword) {
    const error = validatePassword(newPassword);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const hash = await hashPassword(newPassword);
    await updatePasswordHash(user.id, hash);
  }

  // Refresh cookie so the session reflects any changes and gets a new expiry
  await setSessionCookie(updated.id);

  return NextResponse.json({ user: updated });
}
