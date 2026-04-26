"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { DailySummary } from "@/lib/types";

interface WeeklyChartProps {
  summaries: DailySummary[];
  calorieGoal: number;
}

export function WeeklyChart({ summaries, calorieGoal }: WeeklyChartProps) {
  const data = summaries.map((s) => ({
    date: format(parseISO(s.date), "EEE"),
    fullDate: format(parseISO(s.date), "MMM d"),
    calories: Math.round(s.total_calories),
    protein: Math.round(s.total_protein),
    carbs: Math.round(s.total_carbs),
    fat: Math.round(s.total_fat),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${value}${name === "calories" ? " kcal" : "g"}`,
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(_label: any, payload: any) =>
            payload?.[0]?.payload?.fullDate || _label
          }
        />
        <ReferenceLine
          y={calorieGoal}
          stroke="#10b981"
          strokeDasharray="5 5"
          label={{ value: "Goal", position: "right", fontSize: 11 }}
        />
        <Bar
          dataKey="calories"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          opacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
