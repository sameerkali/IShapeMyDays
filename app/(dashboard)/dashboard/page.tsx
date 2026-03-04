"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { Fire, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { getCached, setCache } from "@/lib/cache";
import type { Habit, HabitEntry, FoodLog, Category } from "@/lib/types/database";

type DashboardCache = {
  habits: Habit[];
  todayEntries: HabitEntry[];
  categories: Category[];
  foodLogs: FoodLog[];
  calorieTarget: number;
  streak: number;
  userName: string;
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const cached = getCached<DashboardCache>("dashboard");
  const [habits, setHabits] = useState<Habit[]>(cached?.habits || []);
  const [todayEntries, setTodayEntries] = useState<HabitEntry[]>(cached?.todayEntries || []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories || []);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>(cached?.foodLogs || []);
  const [calorieTarget, setCalorieTarget] = useState(cached?.calorieTarget || 2000);
  const [streak, setStreak] = useState(cached?.streak || 0);
  const [userName, setUserName] = useState(cached?.userName || "");
  const [isLoading, setIsLoading] = useState(!cached);
  const router = useRouter();
  const supabase = createClient();

  const today = formatDate(new Date());

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const [
      profileRes,
      habitsRes,
      categoriesRes,
      todayEntriesRes,
      foodRes,
      settingsRes,
      streakEntriesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", user.id).single(),
      supabase.from("habits").select("*").eq("active", true),
      supabase.from("categories").select("*").eq("active", true).order("order"),
      supabase.from("habit_entries").select("*").eq("entry_date", today),
      supabase
        .from("food_logs")
        .select("*")
        .gte("logged_at", `${today}T00:00:00`)
        .lt("logged_at", `${today}T23:59:59.999`),
      supabase.from("calorie_settings").select("*").single(),
      supabase
        .from("habit_entries")
        .select("entry_date, completed")
        .eq("completed", true)
        .gte("entry_date", formatDate(new Date(Date.now() - 60 * 86400000)))
        .order("entry_date", { ascending: false }),
    ]);

    const newName = profileRes.data?.name || "";
    const newHabits = habitsRes.data || [];
    const newCategories = categoriesRes.data || [];
    const newTodayEntries = todayEntriesRes.data || [];
    const newFoodLogs = foodRes.data || [];
    const newCalorieTarget = settingsRes.data?.daily_target || 2000;

    setUserName(newName);
    setHabits(newHabits);
    setCategories(newCategories);
    setTodayEntries(newTodayEntries);
    setFoodLogs(newFoodLogs);
    setCalorieTarget(newCalorieTarget);

    // Calculate streak
    let newStreak = 0;
    const totalActiveHabits = newHabits.length;
    if (totalActiveHabits > 0 && streakEntriesRes.data) {
      const entriesByDate = new Map<string, number>();
      streakEntriesRes.data.forEach((e: { entry_date: string }) => {
        entriesByDate.set(e.entry_date, (entriesByDate.get(e.entry_date) || 0) + 1);
      });

      const d = new Date();
      const todayComplete = (entriesByDate.get(formatDate(d)) || 0) >= totalActiveHabits;
      if (!todayComplete) d.setDate(d.getDate() - 1);

      while (true) {
        const key = formatDate(d);
        const completedCount = entriesByDate.get(key) || 0;
        if (completedCount >= totalActiveHabits) {
          newStreak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
      setStreak(newStreak);
    }

    setCache<DashboardCache>("dashboard", {
      habits: newHabits,
      todayEntries: newTodayEntries,
      categories: newCategories,
      foodLogs: newFoodLogs,
      calorieTarget: newCalorieTarget,
      streak: newStreak,
      userName: newName,
    });

    setIsLoading(false);
  }, [supabase, router, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedCount = todayEntries.filter((e) => e.completed).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const totalCalories = foodLogs.reduce((sum, f) => sum + f.calories, 0);

  // Category-wise summaries
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const categorySummaries = categories
    .map((cat) => {
      const catHabits = habits.filter((h) => h.category_id === cat.id);
      const catCompleted = catHabits.filter((h) =>
        todayEntries.find((e) => e.habit_id === h.id && e.completed)
      ).length;
      return {
        category: cat,
        total: catHabits.length,
        completed: catCompleted,
      };
    })
    .filter((s) => s.total > 0);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (isLoading) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Greeting skeleton */}
          <div>
            <Skeleton width="140px" height="20px" />
            <Skeleton width="200px" height="14px" style={{ marginTop: "var(--space-2)" }} />
          </div>
          {/* 2 stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <SkeletonCard>
              <Skeleton width="50px" height="12px" />
              <Skeleton width="70px" height="28px" style={{ marginTop: "var(--space-2)" }} />
            </SkeletonCard>
            <SkeletonCard>
              <Skeleton width="50px" height="12px" />
              <Skeleton width="70px" height="28px" style={{ marginTop: "var(--space-2)" }} />
            </SkeletonCard>
          </div>
          {/* Progress card */}
          <SkeletonCard>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <Skeleton width="64px" height="64px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="12px" style={{ marginTop: "var(--space-2)" }} />
              </div>
            </div>
          </SkeletonCard>
          {/* Habit rows */}
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <Skeleton width="20px" height="20px" borderRadius="50%" />
                <Skeleton width="60%" height="14px" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" />

      <div style={{ padding: "var(--space-4)" }}>
        {/* Greeting */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "var(--space-1)" }}>
            {greeting}, {userName.split(" ")[0] || "there"} 👋
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Here&apos;s your progress for today.
          </p>
        </div>

        {/* ========== STATS ROW ========== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          {/* Habits Complete */}
          <Card padding="md">
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-1)",
                  marginBottom: "var(--space-2)",
                }}
              >
                <CheckCircle size={18} weight="fill" color="var(--accent-primary)" />
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                  Habits
                </span>
              </div>
              <span style={{ fontSize: "28px", fontWeight: 700 }}>
                {completedCount}/{totalHabits}
              </span>
              <div
                style={{
                  marginTop: "var(--space-2)",
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor: "var(--bg-tertiary)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${completionPct}%`,
                    height: "100%",
                    backgroundColor: "var(--accent-primary)",
                    borderRadius: "2px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Streak */}
          <Card padding="md">
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-1)",
                  marginBottom: "var(--space-2)",
                }}
              >
                <Fire size={18} weight="fill" color="var(--status-warning)" />
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                  Streak
                </span>
              </div>
              <span style={{ fontSize: "28px", fontWeight: 700 }}>
                {streak}
              </span>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
                {streak === 0 ? "Start today!" : streak === 1 ? "day" : "days"}
              </p>
            </div>
          </Card>
        </div>

        {/* ========== CALORIE WIDGET ========== */}
        <Card padding="lg" style={{ marginBottom: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-5)",
            }}
          >
            <ProgressRing
              value={totalCalories}
              max={calorieTarget}
              size={90}
              strokeWidth={8}
              label="kcal"
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                Today&apos;s Calories
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Consumed</span>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>{totalCalories}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: "var(--space-1)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Remaining</span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color:
                      calorieTarget - totalCalories >= 0
                        ? "var(--accent-primary)"
                        : "var(--status-error)",
                  }}
                >
                  {Math.abs(calorieTarget - totalCalories)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ========== CATEGORY SUMMARIES ========== */}
        {categorySummaries.length > 0 && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--space-3)", color: "var(--text-muted)" }}>
              By Category
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {categorySummaries.map(({ category, total, completed }) => {
                const pct = Math.round((completed / total) * 100);
                return (
                  <Card key={category.id} padding="sm">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-1) 0",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: category.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: 500 }}>
                        {category.name}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)", marginRight: "var(--space-2)" }}>
                        {completed}/{total}
                      </span>
                      <div
                        style={{
                          width: "48px",
                          height: "4px",
                          borderRadius: "2px",
                          backgroundColor: "var(--bg-tertiary)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: category.color,
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== QUICK ACTION ========== */}
        <Button
          variant="primary"
          fullWidth
          onClick={() => router.push("/log")}
          style={{ gap: "var(--space-2)" }}
        >
          {completedCount === totalHabits && totalHabits > 0
            ? "Review Today's Log"
            : "Log Today"}
          <ArrowRight size={18} weight="bold" />
        </Button>
      </div>
    </>
  );
}
