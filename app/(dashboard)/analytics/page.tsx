"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import type { Habit, HabitEntry, Category, FoodLog } from "@/lib/types/database";
import { fetchAnalyticsPageData } from "@/lib/server/actions";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function dayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

type RangeKey = "7" | "30";

function getGitHubGreen(pct: number, hasTotal: boolean): { fill: string; border: string } {
  if (!hasTotal || pct === 0) return { fill: "#161b22", border: "#21262d" };
  if (pct <= 25) return { fill: "#0e4429", border: "#0e4429" };
  if (pct <= 50) return { fill: "#006d32", border: "#006d32" };
  if (pct <= 75) return { fill: "#26a641", border: "#26a641" };
  return { fill: "#39d353", border: "#39d353" };
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        padding: "14px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
        {label}
      </p>
      <p style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--text-primary)" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "12px" }}>
      <p style={{ fontWeight: 700, marginBottom: "2px" }}>{label}</p>
      <p style={{ color: "#39d353" }}>{payload[0].value}% done</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("7");
  const rangeDays = parseInt(range);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [currentCalorieTarget, setCurrentCalorieTarget] = useState(2000);
  const [targetHistory, setTargetHistory] = useState<{ target: number; effectiveFrom: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; pct: number; completed: number; total: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAnalyticsPageData();
      setHabits(data.habits);
      setEntries(data.entries);
      setCategories(data.categories);
      setFoodLogs(data.foodLogs || []);
      setCurrentCalorieTarget(data.currentCalorieTarget || 2000);
      setTargetHistory(data.targetHistory || []);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Dynamic Target Lookup for Historical Integrity
  const getHistoricalTarget = useCallback((dateStr: string): number => {
    if (!targetHistory.length) return currentCalorieTarget;
    // Find latest record with effectiveFrom <= dateStr
    const match = [...targetHistory].reverse().find((h) => h.effectiveFrom <= dateStr);
    return match ? match.target : currentCalorieTarget;
  }, [targetHistory, currentCalorieTarget]);

  // ── HELPERS ───────────────────────────────────
  const getActiveHabitsForDate = (dateStr: string): Habit[] => {
    const endOfDay = `${dateStr}T23:59:59.999Z`;
    return habits.filter((h) => {
      const createdBefore = h.created_at <= endOfDay;
      const notDeletedYet = !h.deleted_at || h.deleted_at > endOfDay;
      return h.active && createdBefore && notDeletedYet;
    });
  };

  const todayActiveHabits = getActiveHabitsForDate(formatDate(new Date()));
  const totalActiveHabitsToday = todayActiveHabits.length;

  // ── DAILY DATA ────────────────────────────────
  const dailyData: { date: string; label: string; dayLabel: string; pct: number; completed: number; total: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = formatDate(d);
    const dayActiveHabits = getActiveHabitsForDate(key);
    const dayActiveIds = new Set(dayActiveHabits.map((h) => h.id));
    const dayEntries = entries.filter((e) => e.entry_date === key && e.completed && dayActiveIds.has(e.habit_id));
    const completedCount = dayEntries.length;
    const total = dayActiveHabits.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    dailyData.push({ date: key, label: shortDate(key), dayLabel: dayName(key), pct, completed: completedCount, total });
  }

  // ── KCAL BUDGET COMPUTATIONS (DYNAMIC & HISTORICAL) ──
  let periodKcalBudget = 0;
  let periodKcalConsumed = 0;

  dailyData.forEach((d) => {
    const dailyTarget = getHistoricalTarget(d.date);
    periodKcalBudget += dailyTarget;
    const dayFoods = foodLogs.filter((f) => f.logged_at.startsWith(d.date));
    const dayCalories = dayFoods.reduce((sum, f) => sum + f.calories, 0);
    periodKcalConsumed += dayCalories;
  });

  const periodKcalDiff = periodKcalBudget - periodKcalConsumed;
  const isKcalOver = periodKcalDiff < 0;
  const kcalPct = periodKcalBudget > 0 ? Math.round((periodKcalConsumed / periodKcalBudget) * 100) : 0;
  const dailyAvgKcal = rangeDays > 0 ? Math.round(periodKcalConsumed / rangeDays) : 0;

  // ── 30-DAY GITHUB HEATMAP DATA ─────────────────
  const githubHeatmapDays: { date: string; label: string; dayLabel: string; pct: number; completed: number; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = formatDate(d);
    const dayActiveHabits = getActiveHabitsForDate(key);
    const dayActiveIds = new Set(dayActiveHabits.map((h) => h.id));
    const dayEntries = entries.filter((e) => e.entry_date === key && e.completed && dayActiveIds.has(e.habit_id));
    const completedCount = dayEntries.length;
    const total = dayActiveHabits.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    githubHeatmapDays.push({ date: key, label: shortDate(key), dayLabel: dayName(key), pct, completed: completedCount, total });
  }

  // ── PREVIOUS PERIOD DATA (for Momentum) ───────
  let prevTotalPossible = 0;
  let prevTotalCompleted = 0;
  for (let i = (rangeDays * 2) - 1; i >= rangeDays; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = formatDate(d);
    const dayActiveHabits = getActiveHabitsForDate(key);
    const dayActiveIds = new Set(dayActiveHabits.map((h) => h.id));
    const dayEntries = entries.filter((e) => e.entry_date === key && e.completed && dayActiveIds.has(e.habit_id));
    prevTotalPossible += dayActiveHabits.length;
    prevTotalCompleted += dayEntries.length;
  }
  const prevAvgPct = prevTotalPossible > 0 ? Math.round((prevTotalCompleted / prevTotalPossible) * 100) : 0;

  // ── CATEGORY PERFORMANCE ───────────────────────
  const categoryData = categories.map((cat) => {
    const catHabits = habits.filter((h) => h.category_id === cat.id);
    const catHabitIds = new Set(catHabits.map((h) => h.id));
    const catEntries = entries.filter((e) => catHabitIds.has(e.habit_id) && e.completed);
    let totalPossible = 0;
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = formatDate(d);
      const dayActiveForCat = getActiveHabitsForDate(key).filter((h) => h.category_id === cat.id);
      totalPossible += dayActiveForCat.length;
    }
    const pct = totalPossible > 0 ? Math.round((catEntries.length / totalPossible) * 100) : 0;
    return { name: cat.name, color: cat.color, pct, completed: catEntries.length, total: totalPossible };
  }).filter((d) => d.total > 0);

  // ── STREAK ─────────────────────────────────────
  let currentStreak = 0;
  if (totalActiveHabitsToday > 0) {
    const d = new Date();
    const todayKey = formatDate(d);
    const todayHabits = getActiveHabitsForDate(todayKey);
    const todayCompletedEntries = entries.filter((e) => e.entry_date === todayKey && e.completed);
    if (todayCompletedEntries.length < todayHabits.length) d.setDate(d.getDate() - 1);
    while (true) {
      const key = formatDate(d);
      const dayHabits = getActiveHabitsForDate(key);
      if (dayHabits.length === 0) break;
      const dayCompleted = entries.filter((e) => e.entry_date === key && e.completed).length;
      if (dayCompleted >= dayHabits.length) { currentStreak++; d.setDate(d.getDate() - 1); }
      else break;
    }
  }

  // ── BEST STREAK ────────────────────────────────
  let bestStreak = 0, tempStreak = 0;
  for (const day of dailyData) {
    if (day.completed >= day.total && day.total > 0) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 0;
  }

  // ── AVG COMPLETION ─────────────────────────────
  const avgCompletion = dailyData.length > 0
    ? Math.round(dailyData.reduce((sum, d) => sum + d.pct, 0) / dailyData.length)
    : 0;

  const momentumDelta = avgCompletion - prevAvgPct;
  const totalCompletions = entries.filter((e) => e.completed).length;

  // ── TOTAL DURATION TRACKED ─────────────────────
  const rangeDateKeys = new Set(dailyData.map((d) => d.date));
  const totalDurationMinutes = entries
    .filter((e) => rangeDateKeys.has(e.entry_date) && e.value > 0)
    .reduce((sum, e) => sum + e.value, 0);
  const formattedDuration = totalDurationMinutes >= 60
    ? `${(totalDurationMinutes / 60).toFixed(1)} hrs`
    : `${totalDurationMinutes} mins`;

  const perfectDays = dailyData.filter((d) => d.pct === 100 && d.total > 0).length;

  const perfectRatio = rangeDays > 0 ? (perfectDays / rangeDays) * 100 : 0;
  const streakBonus = Math.min((currentStreak / 10) * 100, 100);
  const consistencyIndex = Math.min(100, Math.round((avgCompletion * 0.6) + (perfectRatio * 0.25) + (streakBonus * 0.15)));

  const daysWithData = dailyData.filter((d) => d.total > 0);
  const worstDay = daysWithData.length > 0
    ? daysWithData.reduce((min, d) => d.pct < min.pct ? d : min, daysWithData[0])
    : null;

  const habitCompletionMap = new Map<string, number>();
  entries.filter((e) => e.completed).forEach((e) => {
    habitCompletionMap.set(e.habit_id, (habitCompletionMap.get(e.habit_id) || 0) + 1);
  });
  let bestHabitName = "—";
  let bestHabitPct = 0;
  habitCompletionMap.forEach((count, habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    let activeDays = 0;
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = formatDate(d);
      const endOfDay = `${key}T23:59:59.999Z`;
      const wasActive = habit.created_at <= endOfDay && (!habit.deleted_at || habit.deleted_at > endOfDay);
      if (wasActive) activeDays++;
    }
    const pct = activeDays > 0 ? Math.round((count / activeDays) * 100) : 0;
    if (pct > bestHabitPct) { bestHabitPct = pct; bestHabitName = habit.name || "—"; }
  });

  const habitRates = habits
    .filter((h) => !h.deleted_at)
    .map((h) => {
      let activeDays = 0;
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = formatDate(d);
        const endOfDay = `${key}T23:59:59.999Z`;
        const wasActive = h.created_at <= endOfDay && (!h.deleted_at || h.deleted_at > endOfDay);
        if (wasActive) activeDays++;
      }
      const completed = habitCompletionMap.get(h.id) || 0;
      const pct = activeDays > 0 ? Math.round((completed / activeDays) * 100) : 0;
      return { id: h.id, name: h.name, pct, completed, activeDays };
    })
    .sort((a, b) => b.pct - a.pct);

  const highPerformers = habitRates.filter((h) => h.pct >= 80).length;
  const moderatePerformers = habitRates.filter((h) => h.pct >= 50 && h.pct < 80).length;
  const focusPerformers = habitRates.filter((h) => h.pct < 50).length;

  const dayOfWeekMap: Record<string, { total: number; completed: number }> = {};
  dailyData.forEach((d) => {
    const dow = d.dayLabel;
    if (!dayOfWeekMap[dow]) dayOfWeekMap[dow] = { total: 0, completed: 0 };
    dayOfWeekMap[dow].total += d.total;
    dayOfWeekMap[dow].completed += d.completed;
  });
  let bestDow = "—";
  let bestDowPct = 0;
  Object.entries(dayOfWeekMap).forEach(([dow, { total, completed }]) => {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (pct > bestDowPct) { bestDowPct = pct; bestDow = dow; }
  });

  if (isLoading) {
    return (
      <>
        <TopBar title="Analytics" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </>
    );
  }

  if (totalActiveHabitsToday === 0) {
    return (
      <>
        <TopBar title="Analytics" />
        <div style={{ padding: "16px", textAlign: "center", paddingTop: "60px" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>No data yet</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Create habits and start logging to see analytics.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Analytics" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── RANGE TOGGLE ── */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {(["7", "30"] as RangeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              style={{
                flex: 1,
                height: "40px",
                background: range === key ? "var(--white)" : "transparent",
                color: range === key ? "var(--black)" : "var(--text-muted)",
                border: "none",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font)",
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "all var(--t-fast)",
                borderRight: key === "7" ? "1px solid var(--border)" : "none",
              }}
            >
              {key} Days
            </button>
          ))}
        </div>

        {/* ── HERO CONSISTENCY SCORE & MOMENTUM CARD ── */}
        <Card padding="lg">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "4px" }}>
                Consistency Score
              </p>
              <div style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {consistencyIndex}<span style={{ fontSize: "20px", color: "var(--text-muted)", fontWeight: 400 }}>/100</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "4px" }}>
                Momentum
              </p>
              <div style={{ fontSize: "20px", fontWeight: 800, color: momentumDelta >= 0 ? "#39d353" : "var(--status-error)" }}>
                {momentumDelta >= 0 ? `+${momentumDelta}%` : `${momentumDelta}%`}
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>vs prev {rangeDays}d</span>
            </div>
          </div>
          <div style={{ height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${consistencyIndex}%`, height: "100%", backgroundColor: "#39d353", transition: "width 0.6s ease" }} />
          </div>
        </Card>

        {/* ── DYNAMIC KCAL BUDGET ANALYTICS CARD ── */}
        <Card padding="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                {rangeDays}-Day Calorie Budget
              </p>
              <p style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", marginTop: "2px" }}>
                {periodKcalConsumed.toLocaleString()} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>/ {periodKcalBudget.toLocaleString()} kcal</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: isKcalOver ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
                color: isKcalOver ? "var(--status-error)" : "#39d353",
                border: `1px solid ${isKcalOver ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
              }}>
                {isKcalOver ? `+${Math.abs(periodKcalDiff)} OVER` : `${periodKcalDiff} REMAINING`}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "6px", backgroundColor: "var(--border)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{
              width: `${Math.min(kcalPct, 100)}%`,
              height: "100%",
              backgroundColor: isKcalOver ? "var(--status-error)" : "#39d353",
              transition: "width 0.6s ease",
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
            <span>Used: <strong style={{ color: "var(--text-primary)" }}>{kcalPct}%</strong></span>
            <span>Daily Avg: <strong style={{ color: "var(--text-primary)" }}>{dailyAvgKcal} kcal/day</strong></span>
          </div>

          {isKcalOver && (
            <div style={{ marginTop: "10px", padding: "8px 10px", backgroundColor: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: "11px", color: "var(--status-error)", fontWeight: 600 }}>
                ⚠️ Over your {rangeDays}-day budget by +{Math.abs(periodKcalDiff)} kcal total. Reduce daily intake to realign.
              </p>
            </div>
          )}
        </Card>

        {/* ── GITHUB-STYLE CONTRIBUTION HEAT GRAPH CARD ── */}
        <Card padding="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Activity Contribution Graph
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                30-Day Activity Heatmap
              </p>
            </div>
            {hoveredDay && (
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#39d353" }}>
                {hoveredDay.label}: {hoveredDay.pct}% ({hoveredDay.completed}/{hoveredDay.total})
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "5px" }}>
            {githubHeatmapDays.map((d) => {
              const colors = getGitHubGreen(d.pct, d.total > 0);
              return (
                <div
                  key={d.date}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${d.label}: ${d.pct}% (${d.completed}/${d.total} completed)`}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "3px",
                    backgroundColor: colors.fill,
                    border: `1px solid ${colors.border}`,
                    cursor: "pointer",
                    transition: "transform 0.1s ease",
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", marginTop: "14px" }}>
            <span style={{ fontSize: "9px", color: "var(--text-muted)", marginRight: "4px" }}>Less</span>
            {[
              { fill: "#161b22", border: "#21262d" },
              { fill: "#0e4429", border: "#0e4429" },
              { fill: "#006d32", border: "#006d32" },
              { fill: "#26a641", border: "#26a641" },
              { fill: "#39d353", border: "#39d353" },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  width: "11px",
                  height: "11px",
                  borderRadius: "2px",
                  backgroundColor: c.fill,
                  border: `1px solid ${c.border}`,
                }}
              />
            ))}
            <span style={{ fontSize: "9px", color: "var(--text-muted)", marginLeft: "4px" }}>More</span>
          </div>
        </Card>

        {/* ── HABIT TIER DISTRIBUTION BAR ── */}
        {habitRates.length > 0 && (
          <Card padding="md">
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>
              Habit Performance Tiers
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#39d353", textTransform: "uppercase" }}>Strong (≥80%)</span>
                <p style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{highPerformers}</p>
              </div>
              <div style={{ flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--status-warning)", textTransform: "uppercase" }}>Steady (50-79%)</span>
                <p style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{moderatePerformers}</p>
              </div>
              <div style={{ flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--status-error)", textTransform: "uppercase" }}>Focus (&lt;50%)</span>
                <p style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{focusPerformers}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── COMPLETION LINE CHART ── */}
        <Card padding="md">
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>
            Daily Completion Trend
          </p>
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "var(--text-muted)", fontWeight: 600 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  interval={range === "30" ? 4 : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "var(--text-muted)", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#39d353"
                  strokeWidth={1.5}
                  dot={{ r: range === "7" ? 3 : 0, fill: "#39d353", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#39d353", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── CATEGORY BAR CHART ── */}
        {categoryData.length > 0 && (
          <Card padding="md">
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>
              Category Breakdown
            </p>
            <div style={{ width: "100%", height: Math.max(120, categoryData.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 500 }} axisLine={false} tickLine={false} width={90} />
                  <Bar dataKey="pct" radius={[0, 2, 2, 0]} fill="#39d353" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* ── PER-HABIT RATES TABLE ── */}
        {habitRates.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>
              Habit Success Leaderboard
            </p>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {habitRates.map((h, idx) => (
                <div
                  key={h.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "11px 14px",
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: idx < habitRates.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", width: "20px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    #{idx + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.name}
                  </span>
                  <div style={{ width: "60px", height: "3px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ width: `${h.pct}%`, height: "100%", backgroundColor: h.pct >= 80 ? "#39d353" : h.pct >= 50 ? "var(--status-warning)" : "var(--status-error)" }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: h.pct >= 80 ? "var(--text-primary)" : "var(--text-muted)", width: "36px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {h.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SPOTLIGHTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: worstDay && worstDay.total > 0 && worstDay.pct < 100 ? "1fr 1fr" : "1fr", gap: "10px" }}>
          {bestHabitName !== "—" && (
            <Card padding="md">
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
                Top Performing Habit
              </p>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bestHabitName}</div>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#39d353" }}>{bestHabitPct}% completion</span>
            </Card>
          )}

          {worstDay && worstDay.total > 0 && worstDay.pct < 100 && (
            <Card padding="md">
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
                Weakest Day Spotlight
              </p>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>{worstDay.label}</div>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--status-error)" }}>{worstDay.pct}% completion</span>
            </Card>
          )}
        </div>

        {/* ── ALL 9 STAT CARDS MOVED TO BOTTOM ── */}
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>
            Summary Metrics
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <StatBox label="Avg Rate" value={`${avgCompletion}%`} sub={`last ${rangeDays}d`} />
            <StatBox label="Streak" value={currentStreak} sub={currentStreak === 1 ? "day" : "days"} />
            <StatBox label="Best Streak" value={bestStreak} sub={`in ${rangeDays}d`} />
            <StatBox label="Perfect Days" value={perfectDays} sub={`${Math.round((perfectDays / rangeDays) * 100)}% of days`} />
            <StatBox label="Time Tracked" value={formattedDuration} sub={`in ${rangeDays}d`} />
            <StatBox label="Total Done" value={totalCompletions} sub="all time" />
            <StatBox label="Best Day" value={bestDow} sub={bestDow !== "—" ? `${bestDowPct}% avg` : "no data"} />
            <StatBox label="Active Habits" value={totalActiveHabitsToday} sub="currently active" />
            <StatBox label="Categories" value={categories.length} sub="configured" />
          </div>
        </div>

      </div>
    </>
  );
}
