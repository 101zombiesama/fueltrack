"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealCard } from "@/components/dashboard/meal-card";
import { FoodInput } from "@/components/food-input";
import { format, subDays, addDays, parseISO } from "date-fns";
import type { FoodEntry } from "@/lib/types";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function LogPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entries, setEntries] = useState<FoodEntry[]>([]);

  const loadEntries = useCallback(async () => {
    const res = await fetch(`/api/entries?date=${date}`);
    const data = await res.json();
    setEntries(data.entries || []);
  }, [date]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = async (id: number) => {
    await fetch("/api/entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadEntries();
  };

  const prevDay = () => setDate(format(subDays(parseISO(date), 1), "yyyy-MM-dd"));
  const nextDay = () => {
    const next = addDays(parseISO(date), 1);
    if (next <= new Date()) {
      setDate(format(next, "yyyy-MM-dd"));
    }
  };
  const goToday = () => setDate(format(new Date(), "yyyy-MM-dd"));

  const isToday = date === format(new Date(), "yyyy-MM-dd");

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
      <FoodInput onEntryAdded={loadEntries} />

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(parseISO(date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={nextDay} disabled={isToday}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={goToday}>
            Today
          </Button>
        )}
      </div>

      {/* Daily totals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{Math.round(totals.calories)}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-blue-500">{Math.round(totals.protein)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-amber-500">{Math.round(totals.carbs)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-rose-500">{Math.round(totals.fat)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      {groupedEntries.map((group) => (
        <div key={group.meal}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 capitalize">
            {group.meal}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.entries.map((entry) => (
              <MealCard key={entry.id} entry={entry} onDelete={handleDelete} onUpdated={loadEntries} />
            ))}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No meals logged for this day.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
