import { NextRequest, NextResponse } from "next/server";
import {
  getEntriesByDate,
  getEntriesRange,
  deleteEntry,
  updateEntry,
} from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  if (startDate && endDate) {
    const entries = await getEntriesRange(user.id, startDate, endDate);
    return NextResponse.json({ entries });
  }

  const targetDate = date || format(new Date(), "yyyy-MM-dd");
  const entries = await getEntriesByDate(user.id, targetDate);
  return NextResponse.json({ entries });
}

export async function DELETE(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const success = await deleteEntry(user.id, id);
  return NextResponse.json({ success });
}

export async function PATCH(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }

  const { id, ...updates } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const entry = await updateEntry(user.id, id, updates);
  return NextResponse.json({ entry });
}
