import { NextRequest, NextResponse } from "next/server";
import { getGoals, updateGoals } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }
  const goals = await getGoals(user.id);
  return NextResponse.json(goals);
}

export async function PUT(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }
  const body = await request.json();
  const goals = await updateGoals(user.id, body);
  return NextResponse.json(goals);
}
