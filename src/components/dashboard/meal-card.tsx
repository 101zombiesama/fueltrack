"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditEntryDialog } from "@/components/edit-entry-dialog";
import type { FoodEntry } from "@/lib/types";

const mealEmoji: Record<string, string> = {
  breakfast: "\u{1F305}",
  lunch: "\u{2600}\u{FE0F}",
  dinner: "\u{1F319}",
  snack: "\u{1F36A}",
};

interface MealCardProps {
  entry: FoodEntry;
  onDelete?: (id: number) => void;
  onUpdated?: () => void;
}

export function MealCard({ entry, onDelete, onUpdated }: MealCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card className="group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>{mealEmoji[entry.meal_type]}</span>
              <span className="capitalize">{entry.meal_type}</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="tabular-nums">
                {Math.round(entry.total_calories)} kcal
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 italic">
            &ldquo;{entry.description}&rdquo;
          </p>
          <div className="space-y-1">
            {entry.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {item.quantity} {item.unit} {item.name}
                </span>
                <div className="flex gap-3 text-xs text-muted-foreground tabular-nums">
                  <span>{Math.round(item.calories)} cal</span>
                  <span className="text-blue-500">{item.protein}g P</span>
                  <span className="text-amber-500">{item.carbs}g C</span>
                  <span className="text-rose-500">{item.fat}g F</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs font-medium border-t pt-2">
            <span className="text-blue-500">P: {Math.round(entry.total_protein)}g</span>
            <span className="text-amber-500">C: {Math.round(entry.total_carbs)}g</span>
            <span className="text-rose-500">F: {Math.round(entry.total_fat)}g</span>
          </div>
        </CardContent>
      </Card>

      <EditEntryDialog
        entry={entry}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => onUpdated?.()}
      />
    </>
  );
}
