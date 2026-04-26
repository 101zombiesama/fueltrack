import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { addEntry } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { format } from "date-fns";
import type { FoodItem, FoodEntry } from "@/lib/types";

const client = new OpenAI();

const SYSTEM_PROMPT = `You are a nutrition tracking assistant. The user will describe what they ate in natural language. They may describe a single meal or multiple meals across multiple days.

Your job is to:
1. Parse ALL food items with quantities
2. Estimate the macronutrients (calories, protein, carbs, fat) for each item
3. Determine the meal type (breakfast, lunch, dinner, or snack) from context
4. Determine the date for each meal from context (today's date is provided)
5. Group items into separate meals by date and meal type

Return a JSON response with this exact structure:
{
  "meals": [
    {
      "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
      "date": "YYYY-MM-DD",
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
  ]
}

Guidelines:
- Use standard USDA nutrition data estimates
- Round macros to 1 decimal place
- If meal type isn't specified, infer from time of day or food type
- If date isn't specified, use today's date
- Be accurate with portion sizes - "medium egg" is ~50g, etc.
- All macro values should be in grams, calories in kcal
- ALWAYS return the "meals" array, even for a single meal
- Each distinct meal (different date or meal_type) should be a separate entry in the array
- Return ONLY valid JSON, no explanation text`;

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const { text, localDate, localTime } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    const today = localDate || format(new Date(), "yyyy-MM-dd");
    const currentHour = localTime || String(new Date().getHours());

    const completion = await client.chat.completions.create({
      model: "gpt-5.4-mini-2026-03-17",
      max_completion_tokens: 16384,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Today's date: ${today}\nCurrent time: ${currentHour}:00\n\nUser input: "${text}"`,
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
    const meals = parsed.meals || [parsed];

    const entries: FoodEntry[] = [];

    for (const meal of meals) {
      const items: FoodItem[] = meal.items || [];
      const totalCalories = items.reduce((s: number, i: FoodItem) => s + i.calories, 0);
      const totalProtein = items.reduce((s: number, i: FoodItem) => s + i.protein, 0);
      const totalCarbs = items.reduce((s: number, i: FoodItem) => s + i.carbs, 0);
      const totalFat = items.reduce((s: number, i: FoodItem) => s + i.fat, 0);

      const entry = await addEntry(user.id, {
        date: meal.date || today,
        meal_type: meal.meal_type,
        description: text,
        items,
        total_calories: Math.round(totalCalories * 10) / 10,
        total_protein: Math.round(totalProtein * 10) / 10,
        total_carbs: Math.round(totalCarbs * 10) / 10,
        total_fat: Math.round(totalFat * 10) / 10,
      });

      entries.push(entry);
    }

    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    console.error("Parse food error:", error);
    return NextResponse.json(
      { error: "Failed to parse food entry" },
      { status: 500 }
    );
  }
}
