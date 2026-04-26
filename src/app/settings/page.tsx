"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Target } from "lucide-react";
import type { DailyGoals } from "@/lib/types";

export default function SettingsPage() {
  const [goals, setGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then(setGoals);
  }, []);

  const handleSave = async () => {
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goals),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const presets = [
    { name: "Cut (Lean)", calories: 1800, protein: 180, carbs: 150, fat: 55 },
    { name: "Maintain", calories: 2200, protein: 160, carbs: 220, fat: 70 },
    { name: "Bulk (Clean)", calories: 2800, protein: 200, carbs: 300, fat: 80 },
    { name: "High Protein Cut", calories: 2000, protein: 220, carbs: 130, fat: 60 },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your daily macro goals
        </p>
      </div>

      {/* Quick presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Quick Presets
          </CardTitle>
          <CardDescription>
            Choose a preset based on your goal, then customize below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="h-auto flex-col py-3"
                onClick={() => setGoals(preset)}
              >
                <span className="text-sm font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.calories} kcal
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Goals</CardTitle>
          <CardDescription>
            Set your target macros for each day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input
                id="calories"
                type="number"
                value={goals.calories}
                onChange={(e) =>
                  setGoals({ ...goals, calories: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={goals.protein}
                onChange={(e) =>
                  setGoals({ ...goals, protein: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={goals.carbs}
                onChange={(e) =>
                  setGoals({ ...goals, carbs: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={goals.fat}
                onChange={(e) =>
                  setGoals({ ...goals, fat: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Macro split: {Math.round((goals.protein * 4 / goals.calories) * 100)}% P
              {" / "}
              {Math.round((goals.carbs * 4 / goals.calories) * 100)}% C
              {" / "}
              {Math.round((goals.fat * 9 / goals.calories) * 100)}% F
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {saved ? "Saved!" : "Save Goals"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About FuelTrack</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            FuelTrack uses AI to parse your natural language food descriptions
            and estimate macronutrient content based on USDA standard values.
          </p>
          <p>
            Nutrition estimates are approximate. For precise tracking, verify
            against nutrition labels when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
