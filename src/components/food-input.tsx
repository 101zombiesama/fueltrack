"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Sparkles } from "lucide-react";

interface FoodInputProps {
  onEntryAdded: () => void;
}

export function FoodInput({ onEntryAdded }: FoodInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;

    setLoading(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          localDate: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD
          localTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", hour12: false }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setLastResult(`Error: ${err.error || "Something went wrong"}`);
        return;
      }

      const data = await res.json();
      const entries = data.entries || [data.entry];
      if (entries.length === 1) {
        const e = entries[0];
        setLastResult(
          `Logged ${e.meal_type} (${e.date}): ${Math.round(e.total_calories)} kcal | P: ${Math.round(e.total_protein)}g C: ${Math.round(e.total_carbs)}g F: ${Math.round(e.total_fat)}g`
        );
      } else {
        const totalCal = entries.reduce((s: number, e: { total_calories: number }) => s + e.total_calories, 0);
        setLastResult(
          `Logged ${entries.length} meals (${Math.round(totalCal)} kcal total) across ${new Set(entries.map((e: { date: string }) => e.date)).size} day(s)`
        );
      }
      setText("");
      onEntryAdded();
    } catch {
      setLastResult("Error: Failed to process. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Log your food</span>
          <span className="text-xs text-muted-foreground">
            — just describe what you ate
          </span>
        </div>
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "For lunch I had 200g grilled chicken breast with rice and steamed broccoli"'
            className="min-h-[60px] resize-none"
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            size="icon"
            className="h-[60px] w-12 shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {lastResult && (
          <p
            className={`mt-2 text-sm ${
              lastResult.startsWith("Error")
                ? "text-red-500"
                : "text-emerald-600"
            }`}
          >
            {lastResult}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
