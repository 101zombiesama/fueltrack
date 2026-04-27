"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart as LineIcon, BarChart3 as BarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyGoals, DailySummary } from "@/lib/types";

type MacroKey = "calories" | "protein" | "carbs" | "fat";
type ChartType = "line" | "bar";
type Period = 7 | 30 | 90;

const MACROS: {
  key: MacroKey;
  label: string;
  color: string;
  unit: string;
  axis: "left" | "right";
}[] = [
  { key: "calories", label: "Calories", color: "#10b981", unit: " kcal", axis: "left" },
  { key: "protein", label: "Protein", color: "#3b82f6", unit: "g", axis: "right" },
  { key: "carbs", label: "Carbs", color: "#f59e0b", unit: "g", axis: "right" },
  { key: "fat", label: "Fat", color: "#f43f5e", unit: "g", axis: "right" },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "Week" },
  { value: 30, label: "Month" },
  { value: 90, label: "3 Months" },
];

export function MacroChart({ goals }: { goals: DailyGoals }) {
  const [period, setPeriod] = useState<Period>(7);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [selected, setSelected] = useState<Set<MacroKey>>(
    () => new Set<MacroKey>(["calories", "protein"])
  );
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/summary?days=${period}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSummaries(d.summaries || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const data = useMemo(
    () =>
      summaries.map((s) => ({
        label:
          period === 7
            ? format(parseISO(s.date), "EEE")
            : format(parseISO(s.date), "MMM d"),
        fullDate: format(parseISO(s.date), "MMM d, yyyy"),
        calories: Math.round(s.total_calories),
        protein: Math.round(s.total_protein),
        carbs: Math.round(s.total_carbs),
        fat: Math.round(s.total_fat),
      })),
    [summaries, period]
  );

  const xTickInterval = period === 90 ? 6 : period === 30 ? 2 : 0;

  function toggleMacro(key: MacroKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const usesLeftAxis = MACROS.some(
    (m) => m.axis === "left" && selected.has(m.key)
  );
  const usesRightAxis = MACROS.some(
    (m) => m.axis === "right" && selected.has(m.key)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Macro Trends</CardTitle>
          <div className="flex items-center gap-2">
            <SegmentedControl
              options={PERIODS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              value={period}
              onChange={setPeriod}
            />
            <SegmentedControl
              options={[
                { value: "line" as const, label: <LineIcon className="h-3.5 w-3.5" />, ariaLabel: "Line chart" },
                { value: "bar" as const, label: <BarIcon className="h-3.5 w-3.5" />, ariaLabel: "Bar chart" },
              ]}
              value={chartType}
              onChange={setChartType}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MACROS.map((m) => {
            const active = selected.has(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleMacro(m.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                  active
                    ? "shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                style={
                  active
                    ? {
                        borderColor: m.color,
                        backgroundColor: `${m.color}1a`,
                        color: m.color,
                      }
                    : undefined
                }
                aria-pressed={active}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: active ? m.color : "transparent",
                    border: active ? "none" : `1px solid currentColor`,
                  }}
                />
                {m.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data yet. Start logging your meals!
          </div>
        ) : selected.size === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Select at least one macro to display.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                interval={xTickInterval}
              />
              {usesLeftAxis && (
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  width={48}
                />
              )}
              {usesRightAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  width={36}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => {
                  const macro = MACROS.find((m) => m.key === name);
                  return [`${value}${macro?.unit ?? ""}`, macro?.label ?? name];
                }}
                labelFormatter={(_label, payload) => {
                  const item = payload?.[0]?.payload as
                    | { fullDate?: string }
                    | undefined;
                  return item?.fullDate ?? _label;
                }}
              />

              {MACROS.map((m) =>
                selected.has(m.key) ? (
                  <ReferenceLine
                    key={`${m.key}-goal`}
                    yAxisId={m.axis}
                    y={goals[m.key]}
                    stroke={m.color}
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                    ifOverflow="extendDomain"
                  />
                ) : null
              )}

              {MACROS.map((m) => {
                if (!selected.has(m.key)) return null;
                if (chartType === "line") {
                  return (
                    <Line
                      key={m.key}
                      yAxisId={m.axis}
                      type="monotone"
                      dataKey={m.key}
                      stroke={m.color}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 0, fill: m.color }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  );
                }
                return (
                  <Bar
                    key={m.key}
                    yAxisId={m.axis}
                    dataKey={m.key}
                    fill={m.color}
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.85}
                    isAnimationActive={false}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-background p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-label={opt.ariaLabel}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
