import { NextRequest, NextResponse } from "next/server";
import { getEntriesByDate, getEntriesRange, deleteEntry, updateEntry } from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  if (startDate && endDate) {
    const entries = getEntriesRange(startDate, endDate);
    return NextResponse.json({ entries });
  }

  const targetDate = date || format(new Date(), "yyyy-MM-dd");
  const entries = getEntriesByDate(targetDate);
  return NextResponse.json({ entries });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const success = deleteEntry(id);
  return NextResponse.json({ success });
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const entry = updateEntry(id, updates);
  return NextResponse.json({ entry });
}
