import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getEntryById, updateEntry } from "@/lib/db";
import type { FoodItem } from "@/lib/types";

const client = new OpenAI();

const SYSTEM_PROMPT = `You are a nutrition tracking assistant. The user has an existing food entry and wants to modify it using natural language.

You will receive the current entry data and the user's edit instruction. Apply the edit and return the updated entry.

Return a JSON response with this exact structure:
{
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
  "items": [
    {
      "name": "food item name",
      "quantity": number,
      "unit": "string (e.g., 'medium', 'grams', 'cup', 'piece')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Guidelines:
- Keep unchanged items exactly as they are
- Use standard USDA nutrition data estimates for new/modified items
- Round macros to 1 decimal place
- All macro values should be in grams, calories in kcal
- Return ONLY valid JSON, no explanation text`;

export async function POST(request: NextRequest) {
  try {
    const { id, instruction } = await request.json();

    if (!id || !instruction) {
      return NextResponse.json(
        { error: "Missing id or instruction" },
        { status: 400 }
      );
    }

    const existing = getEntryById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-5.4-mini-2026-03-17",
      max_completion_tokens: 16384,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Current entry:\nMeal type: ${existing.meal_type}\nItems: ${JSON.stringify(existing.items, null, 2)}\n\nEdit instruction: "${instruction}"`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const items: FoodItem[] = parsed.items || [];

    const totalCalories = items.reduce((s, i) => s + i.calories, 0);
    const totalProtein = items.reduce((s, i) => s + i.protein, 0);
    const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
    const totalFat = items.reduce((s, i) => s + i.fat, 0);

    const entry = updateEntry(id, {
      meal_type: parsed.meal_type || existing.meal_type,
      items,
      total_calories: Math.round(totalCalories * 10) / 10,
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Edit entry error:", error);
    return NextResponse.json(
      { error: "Failed to edit entry" },
      { status: 500 }
    );
  }
}
