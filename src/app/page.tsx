"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { MacroBars } from "@/components/dashboard/macro-bars";
import { MealCard } from "@/components/dashboard/meal-card";
import { MacroChart } from "@/components/dashboard/macro-chart";
import { FoodInput } from "@/components/food-input";
import { format } from "date-fns";
import type { FoodEntry, DailyGoals } from "@/lib/types";
import { Flame, TrendingUp, Utensils } from "lucide-react";

export default function Dashboard() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoals>({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = useCallback(async () => {
    const [entriesRes, goalsRes] = await Promise.all([
      fetch(`/api/entries?date=${today}`),
      fetch("/api/goals"),
    ]);

    const entriesData = await entriesRes.json();
    const goalsData = await goalsRes.json();

    setEntries(entriesData.entries || []);
    setGoals(goalsData);
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    await fetch("/api/entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.total_calories,
      protein: acc.protein + e.total_protein,
      carbs: acc.carbs + e.total_carbs,
      fat: acc.fat + e.total_fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const mealOrder = ["breakfast", "lunch", "dinner", "snack"] as const;
  const groupedEntries = mealOrder
    .map((meal) => ({
      meal,
      entries: entries.filter((e) => e.meal_type === meal),
    }))
    .filter((g) => g.entries.length > 0);

  return (
    <div className="space-y-6">
      <FoodInput onEntryAdded={loadData} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Flame className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Calories</p>
              <p className="text-xl font-bold tabular-nums">{Math.round(totals.calories)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="text-xl font-bold tabular-nums">{Math.round(totals.protein)}g</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Utensils className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carbs</p>
              <p className="text-xl font-bold tabular-nums">{Math.round(totals.carbs)}g</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <Flame className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fat</p>
              <p className="text-xl font-bold tabular-nums">{Math.round(totals.fat)}g</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <CalorieRing consumed={totals.calories} goal={goals.calories} />
            <div className="flex-1 w-full">
              <MacroBars
                protein={{ current: totals.protein, goal: goals.protein }}
                carbs={{ current: totals.carbs, goal: goals.carbs }}
                fat={{ current: totals.fat, goal: goals.fat }}
              />
            </div>
          </CardContent>
        </Card>

        <MacroChart goals={goals} />
      </div>

      {groupedEntries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Meals</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {groupedEntries.flatMap((g) =>
              g.entries.map((entry) => (
                <MealCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onUpdated={loadData}
                />
              ))
            )}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No meals logged today</h3>
            <p className="text-sm text-muted-foreground">
              Use the input above to log what you ate. Just type naturally!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
