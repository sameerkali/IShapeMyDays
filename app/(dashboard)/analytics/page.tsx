"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { Fire, TrendUp, Trophy } from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { getCached, setCache } from "@/lib/cache";
import type { Habit, HabitEntry, Category } from "@/lib/types/database";

type AnalyticsCache = {
  habits: Habit[];
  entries: HabitEntry[];
  categories: Category[];
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type RangeKey = "7" | "30";

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("7");
  const rangeDays = parseInt(range);
  const cacheKey = `analytics_${rangeDays}`;
  const cached = getCached<AnalyticsCache>(cacheKey);

  const [habits, setHabits] = useState<Habit[]>(cached?.habits || []);
  const [entries, setEntries] = useState<HabitEntry[]>(cached?.entries || []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories || []);
  const [isLoading, setIsLoading] = useState(!cached);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const startDate = formatDate(new Date(Date.now() - rangeDays * 86400000));

    const [habitsRes, entriesRes, categoriesRes] = await Promise.all([
      supabase.from("habits").select("*"),
      supabase
        .from("habit_entries")
        .select("*")
        .gte("entry_date", startDate)
        .order("entry_date", { ascending: true }),
      supabase.from("categories").select("*").order("order"),
    ]);

    setHabits(habitsRes.data || []);
    setEntries(entriesRes.data || []);
    setCategories(categoriesRes.data || []);

    setCache<AnalyticsCache>(cacheKey, {
      habits: habitsRes.data || [],
      entries: entriesRes.data || [],
      categories: categoriesRes.data || [],
    });

    setIsLoading(false);
  }, [supabase, router, rangeDays, cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================
  // DAILY COMPLETION CHART DATA
  // =========================================
  const activeHabits = habits.filter((h) => h.active);
  const totalActiveHabits = activeHabits.length;

  const dailyData: { date: string; label: string; pct: number; completed: number; total: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = formatDate(d);
    const dayEntries = entries.filter((e) => e.entry_date === key && e.completed);
    const completedCount = dayEntries.length;
    const pct = totalActiveHabits > 0 ? Math.round((completedCount / totalActiveHabits) * 100) : 0;
    dailyData.push({
      date: key,
      label: shortDate(key),
      pct,
      completed: completedCount,
      total: totalActiveHabits,
    });
  }

  // =========================================
  // CATEGORY PERFORMANCE DATA
  // =========================================
  const categoryData = categories
    .map((cat) => {
      const catHabits = habits.filter((h) => h.category_id === cat.id);
      const catHabitIds = new Set(catHabits.map((h) => h.id));
      const catEntries = entries.filter((e) => catHabitIds.has(e.habit_id) && e.completed);
      const totalPossible = catHabits.length * rangeDays;
      const pct = totalPossible > 0 ? Math.round((catEntries.length / totalPossible) * 100) : 0;
      return {
        name: cat.name,
        color: cat.color,
        pct,
        completed: catEntries.length,
        total: totalPossible,
      };
    })
    .filter((d) => d.total > 0);

  // =========================================
  // STREAK CALCULATION
  // =========================================
  let currentStreak = 0;
  if (totalActiveHabits > 0) {
    const d = new Date();
    const todayEntries = entries.filter((e) => e.entry_date === formatDate(d) && e.completed);
    if (todayEntries.length < totalActiveHabits) d.setDate(d.getDate() - 1);
    while (true) {
      const key = formatDate(d);
      const dayCompleted = entries.filter((e) => e.entry_date === key && e.completed).length;
      if (dayCompleted >= totalActiveHabits) {
        currentStreak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Best streak in range
  let bestStreak = 0;
  let tempStreak = 0;
  for (const day of dailyData) {
    if (day.completed >= day.total && day.total > 0) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Average completion
  const avgCompletion = dailyData.length > 0
    ? Math.round(dailyData.reduce((sum, d) => sum + d.pct, 0) / dailyData.length)
    : 0;

  // Most consistent habit
  const habitCompletionMap = new Map<string, number>();
  entries.filter((e) => e.completed).forEach((e) => {
    habitCompletionMap.set(e.habit_id, (habitCompletionMap.get(e.habit_id) || 0) + 1);
  });
  let bestHabitName = "—";
  let bestHabitPct = 0;
  habitCompletionMap.forEach((count, habitId) => {
    const pct = Math.round((count / rangeDays) * 100);
    if (pct > bestHabitPct) {
      bestHabitPct = pct;
      const habit = habits.find((h) => h.id === habitId);
      bestHabitName = habit?.name || "—";
    }
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-2) var(--space-3)",
          fontSize: "12px",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: "2px" }}>{label}</p>
        <p style={{ color: "var(--accent-primary)" }}>{payload[0].value}%</p>
      </div>
    );
  };

  return (
    <>
      <TopBar title="Analytics" />

      <div style={{ padding: "var(--space-4)" }}>
        {/* Range Selector */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            marginBottom: "var(--space-5)",
          }}
        >
          {([
            { key: "7" as RangeKey, label: "7 Days" },
            { key: "30" as RangeKey, label: "30 Days" },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              style={{
                flex: 1,
                height: "40px",
                borderRadius: "var(--radius-sm)",
                border: `2px solid ${range === opt.key ? "var(--accent-primary)" : "var(--border-default)"}`,
                backgroundColor: range === opt.key ? "var(--accent-primary)" + "15" : "transparent",
                color: range === opt.key ? "var(--accent-primary)" : "var(--text-muted)",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Chart skeleton */}
            <SkeletonCard>
              <Skeleton width="120px" height="14px" style={{ marginBottom: "var(--space-3)" }} />
              <Skeleton width="100%" height="180px" borderRadius="var(--radius-md)" />
            </SkeletonCard>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i}>
                  <Skeleton width="20px" height="20px" borderRadius="50%" style={{ margin: "0 auto" }} />
                  <Skeleton width="40px" height="22px" style={{ margin: "var(--space-2) auto 0" }} />
                  <Skeleton width="50px" height="10px" style={{ margin: "4px auto 0" }} />
                </SkeletonCard>
              ))}
            </div>
            {/* Second chart skeleton */}
            <SkeletonCard>
              <Skeleton width="140px" height="14px" style={{ marginBottom: "var(--space-3)" }} />
              <Skeleton width="100%" height="160px" borderRadius="var(--radius-md)" />
            </SkeletonCard>
          </div>
        ) : totalActiveHabits === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-10)" }}>
            <p style={{ fontSize: "16px", fontWeight: 500, marginBottom: "var(--space-2)" }}>
              No habits to analyze yet
            </p>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Create habits and start logging to see insights.
            </p>
          </div>
        ) : (
          <>
            {/* ========== STATS ROW ========== */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "var(--space-2)",
                marginBottom: "var(--space-5)",
              }}
            >
              <Card padding="sm">
                <div style={{ textAlign: "center", padding: "var(--space-1) 0" }}>
                  <TrendUp size={18} color="var(--accent-primary)" style={{ marginBottom: "4px" }} />
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{avgCompletion}%</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Avg</div>
                </div>
              </Card>
              <Card padding="sm">
                <div style={{ textAlign: "center", padding: "var(--space-1) 0" }}>
                  <Fire size={18} color="var(--status-warning)" style={{ marginBottom: "4px" }} />
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{currentStreak}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Streak</div>
                </div>
              </Card>
              <Card padding="sm">
                <div style={{ textAlign: "center", padding: "var(--space-1) 0" }}>
                  <Trophy size={18} color="var(--status-warning)" style={{ marginBottom: "4px" }} />
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{bestStreak}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Best</div>
                </div>
              </Card>
            </div>

            {/* ========== COMPLETION LINE CHART ========== */}
            <Card padding="md" style={{ marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                Daily Completion %
              </h3>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-default)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={{ stroke: "var(--border-default)" }}
                      tickLine={false}
                      interval={range === "30" ? 4 : 0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="pct"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: range === "7" ? 4 : 0, fill: "#10B981" }}
                      activeDot={{ r: 6, fill: "#10B981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* ========== CATEGORY BAR CHART ========== */}
            {categoryData.length > 0 && (
              <Card padding="md" style={{ marginBottom: "var(--space-4)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                  Category Performance
                </h3>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border-default)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#CBD5E1" }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Bar
                        dataKey="pct"
                        radius={[0, 4, 4, 0]}
                        fill="#10B981"
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* ========== WEEKLY SUMMARY CARD (5.3) ========== */}
            <Card padding="lg">
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                {range === "7" ? "Weekly" : "Monthly"} Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {/* Completion */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Avg Completion
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color:
                        avgCompletion >= 80
                          ? "var(--accent-primary)"
                          : avgCompletion >= 50
                          ? "var(--status-warning)"
                          : "var(--status-error)",
                    }}
                  >
                    {avgCompletion}%
                  </span>
                </div>

                <div style={{ height: "1px", backgroundColor: "var(--border-default)" }} />

                {/* Best streak */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Best Streak
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 600 }}>
                    🔥 {bestStreak} {bestStreak === 1 ? "day" : "days"}
                  </span>
                </div>

                <div style={{ height: "1px", backgroundColor: "var(--border-default)" }} />

                {/* Most consistent */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Most Consistent
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 600 }}>
                    🏆 {bestHabitName}
                  </span>
                </div>

                <div style={{ height: "1px", backgroundColor: "var(--border-default)" }} />

                {/* Category scores */}
                <div>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "var(--space-2)" }}>
                    Category Scores
                  </span>
                  {categoryData.map((cat) => (
                    <div
                      key={cat.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-1) 0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: cat.color,
                          }}
                        />
                        <span style={{ fontSize: "13px" }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: cat.color }}>
                        {cat.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
