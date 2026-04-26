import { NextRequest, NextResponse } from "next/server";
import { getGoals, updateGoals } from "@/lib/db";

export async function GET() {
  const goals = getGoals();
  return NextResponse.json(goals);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const goals = updateGoals(body);
  return NextResponse.json(goals);
}
