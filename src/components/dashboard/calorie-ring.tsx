"use client";

import { cn } from "@/lib/utils";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  className?: string;
}

export function CalorieRing({ consumed, goal, className }: CalorieRingProps) {
  const percentage = Math.min((consumed / goal) * 100, 100);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative h-48 w-48">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "transition-all duration-700 ease-out",
              isOver ? "text-red-500" : "text-emerald-500"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">
            {Math.round(consumed)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {goal} kcal
          </span>
        </div>
      </div>
      <p className={cn("mt-2 text-sm font-medium", isOver ? "text-red-500" : "text-muted-foreground")}>
        {isOver
          ? `${Math.round(consumed - goal)} kcal over`
          : `${Math.round(remaining)} kcal remaining`}
      </p>
    </div>
  );
}
