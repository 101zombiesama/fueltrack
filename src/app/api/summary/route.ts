import { NextRequest, NextResponse } from "next/server";
import { getEntriesByDate, getEntriesRange } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { format, subDays } from "date-fns";
import type { DailySummary } from "@/lib/types";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7", 10);
  const date = searchParams.get("date");

  if (date) {
    const entries = await getEntriesByDate(user.id, date);
    const summary: DailySummary = {
      date,
      total_calories: entries.reduce((s, e) => s + e.total_calories, 0),
      total_protein: entries.reduce((s, e) => s + e.total_protein, 0),
      total_carbs: entries.reduce((s, e) => s + e.total_carbs, 0),
      total_fat: entries.reduce((s, e) => s + e.total_fat, 0),
      entries,
    };
    return NextResponse.json(summary);
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const start = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  const entries = await getEntriesRange(user.id, start, today);

  const byDate = new Map<string, DailySummary>();
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    byDate.set(d, {
      date: d,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      entries: [],
    });
  }

  for (const entry of entries) {
    const summary = byDate.get(entry.date);
    if (summary) {
      summary.total_calories += entry.total_calories;
      summary.total_protein += entry.total_protein;
      summary.total_carbs += entry.total_carbs;
      summary.total_fat += entry.total_fat;
      summary.entries.push(entry);
    }
  }

  const summaries = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return NextResponse.json({ summaries });
}
