"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Save, Plus, X } from "lucide-react";
import type { FoodEntry, FoodItem, MealType } from "@/lib/types";

interface EditEntryDialogProps {
  entry: FoodEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditEntryDialog({ entry, open, onOpenChange, onSaved }: EditEntryDialogProps) {
  const [mealType, setMealType] = useState<MealType>(entry.meal_type);
  const [items, setItems] = useState<FoodItem[]>(structuredClone(entry.items));
  const [aiInstruction, setAiInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: "", quantity: 1, unit: "piece", calories: 0, protein: 0, carbs: 0, fat: 0 },
    ]);
  };

  const handleManualSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const totalCalories = items.reduce((s, i) => s + Number(i.calories), 0);
      const totalProtein = items.reduce((s, i) => s + Number(i.protein), 0);
      const totalCarbs = items.reduce((s, i) => s + Number(i.carbs), 0);
      const totalFat = items.reduce((s, i) => s + Number(i.fat), 0);

      const res = await fetch("/api/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          meal_type: mealType,
          items,
          total_calories: Math.round(totalCalories * 10) / 10,
          total_protein: Math.round(totalProtein * 10) / 10,
          total_carbs: Math.round(totalCarbs * 10) / 10,
          total_fat: Math.round(totalFat * 10) / 10,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      onSaved();
      onOpenChange(false);
    } catch {
      setError("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleAiEdit = async () => {
    if (!aiInstruction.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/edit-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, instruction: aiInstruction.trim() }),
      });

      if (!res.ok) throw new Error("Failed to edit");

      const data = await res.json();
      setItems(data.entry.items);
      setMealType(data.entry.meal_type);
      setAiInstruction("");
      onSaved();
    } catch {
      setError("Failed to apply AI edit");
    } finally {
      setLoading(false);
    }
  };

  const handleAiKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiEdit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">Manual Edit</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI Edit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Describe what you want to change in plain English.
            </p>
            <div className="flex gap-2">
              <Textarea
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                onKeyDown={handleAiKeyDown}
                placeholder='e.g. "change eggs to 6 eggs", "remove the rice", "add a protein shake with 2 scoops whey"'
                className="min-h-[60px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={handleAiEdit}
                disabled={!aiInstruction.trim() || loading}
                size="icon"
                className="h-[60px] w-12 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>

            <Separator />

            <div className="text-sm font-medium mb-2">Current items:</div>
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm rounded-md bg-muted/50 px-3 py-2">
                  <span>{item.quantity} {item.unit} {item.name}</span>
                  <div className="flex gap-3 text-xs tabular-nums">
                    <span>{Math.round(item.calories)} cal</span>
                    <span className="text-blue-500">{item.protein}g P</span>
                    <span className="text-amber-500">{item.carbs}g C</span>
                    <span className="text-rose-500">{item.fat}g F</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <div className="flex gap-2">
                {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => (
                  <Button
                    key={m}
                    variant={mealType === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMealType(m)}
                    className="capitalize"
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3 sm:col-span-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(i, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(i, "unit", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Calories</Label>
                      <Input
                        type="number"
                        value={item.calories}
                        onChange={(e) => updateItem(i, "calories", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Protein (g)</Label>
                      <Input
                        type="number"
                        value={item.protein}
                        onChange={(e) => updateItem(i, "protein", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Carbs (g)</Label>
                      <Input
                        type="number"
                        value={item.carbs}
                        onChange={(e) => updateItem(i, "carbs", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fat (g)</Label>
                      <Input
                        type="number"
                        value={item.fat}
                        onChange={(e) => updateItem(i, "fat", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addItem} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Item
            </Button>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleManualSave} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
