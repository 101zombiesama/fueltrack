"use client";

import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  colorClass: string;
  bgClass: string;
}

function MacroBar({ label, current, goal, unit = "g", colorClass, bgClass }: MacroBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const isOver = current > goal;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("tabular-nums", isOver && "text-red-500")}>
          {Math.round(current)}/{goal}{unit}
        </span>
      </div>
      <div className={cn("h-2.5 w-full rounded-full", bgClass)}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface MacroBarsProps {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

export function MacroBars({ protein, carbs, fat }: MacroBarsProps) {
  return (
    <div className="space-y-4">
      <MacroBar
        label="Protein"
        current={protein.current}
        goal={protein.goal}
        colorClass="bg-blue-500"
        bgClass="bg-blue-500/15"
      />
      <MacroBar
        label="Carbs"
        current={carbs.current}
        goal={carbs.goal}
        colorClass="bg-amber-500"
        bgClass="bg-amber-500/15"
      />
      <MacroBar
        label="Fat"
        current={fat.current}
        goal={fat.goal}
        colorClass="bg-rose-500"
        bgClass="bg-rose-500/15"
      />
    </div>
  );
}
