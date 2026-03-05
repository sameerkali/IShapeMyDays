"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import {
  CaretLeft,
  CaretRight,
  PlusCircle,
  CheckCircle,
  Circle,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { getCached, setCache } from "@/lib/cache";
import type { Habit, HabitEntry, FoodLog, Category } from "@/lib/types/database";

type LogCache = {
  habits: Habit[];
  categories: Category[];
  entries: HabitEntry[];
  foodLogs: FoodLog[];
  calorieTarget: number;
  recentFoods: FoodLog[];
  durationInput: Record<string, string>;
};

// Helpers
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function displayDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (formatDate(date) === formatDate(today)) return "Today";
  if (formatDate(date) === formatDate(yesterday)) return "Yesterday";
  if (formatDate(date) === formatDate(tomorrow)) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  snack: "🍿 Snack",
};

type FoodFormData = {
  food_name: string;
  calories: string;
  meal_type: MealType;
};

export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = formatDate(selectedDate);
  const cacheKey = `log_${dateKey}`;

  type LogCache = {
    habits: (Habit & { category?: Category })[];
    entries: HabitEntry[];
    foodLogs: FoodLog[];
    calorieTarget: number;
    recentFoods: { food_name: string; calories: number }[];
    durationInput: Record<string, string>;
  };

  const cached = getCached<LogCache>(cacheKey);
  const [habits, setHabits] = useState<(Habit & { category?: Category })[]>(cached?.habits || []);
  const [entries, setEntries] = useState<HabitEntry[]>(cached?.entries || []);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>(cached?.foodLogs || []);
  const [calorieTarget, setCalorieTarget] = useState(cached?.calorieTarget || 2000);
  const [isLoading, setIsLoading] = useState(!cached);
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodForm, setFoodForm] = useState<FoodFormData>({
    food_name: "",
    calories: "",
    meal_type: "breakfast",
  });
  const [foodError, setFoodError] = useState("");
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [recentFoods, setRecentFoods] = useState<{ food_name: string; calories: number }[]>(cached?.recentFoods || []);
  const [durationInput, setDurationInput] = useState<Record<string, string>>(cached?.durationInput || {});

  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    // Fetch all in parallel
    // Only show habits that existed on the selected date:
    // - created on or before the selected date
    // - not deleted, OR deleted after the selected date
    const endOfDay = `${dateKey}T23:59:59.999Z`;

    const [habitsRes, categoriesRes, entriesRes, foodRes, settingsRes, recentRes] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("active", true)
        .lte("created_at", endOfDay)
        .or(`deleted_at.is.null,deleted_at.gt.${endOfDay}`)
        .order("created_at"),
      supabase.from("categories").select("*").order("order"),
      supabase
        .from("habit_entries")
        .select("*")
        .eq("entry_date", dateKey),
      supabase
        .from("food_logs")
        .select("*")
        .gte("logged_at", `${dateKey}T00:00:00`)
        .lt("logged_at", `${dateKey}T23:59:59.999`),
      supabase.from("calorie_settings").select("*").single(),
      // Recent foods for quick-add (last 20 unique)
      supabase
        .from("food_logs")
        .select("food_name, calories")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const categoryMap = new Map(
      (categoriesRes.data || []).map((c: Category) => [c.id, c])
    );

    const habitsWithCategory = (habitsRes.data || []).map((h: Habit) => ({
      ...h,
      category: categoryMap.get(h.category_id),
    }));

    setHabits(habitsWithCategory);
    setEntries(entriesRes.data || []);
    setFoodLogs(foodRes.data || []);
    if (settingsRes.data) setCalorieTarget(settingsRes.data.daily_target);

    // Deduplicate recent foods
    const seen = new Set<string>();
    const uniqueRecent = (recentRes.data || []).filter((f: { food_name: string }) => {
      const key = f.food_name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
    setRecentFoods(uniqueRecent);

    // Initialize duration inputs
    const durationInputs: Record<string, string> = {};
    (entriesRes.data || []).forEach((entry: HabitEntry) => {
      if (entry.value > 0) {
        durationInputs[entry.habit_id] = String(entry.value);
      }
    });
    setDurationInput(durationInputs);

    setCache(cacheKey, {
      habits: habitsWithCategory,
      entries: entriesRes.data || [],
      foodLogs: foodRes.data || [],
      calorieTarget: settingsRes.data?.daily_target || 2000,
      recentFoods: uniqueRecent,
      durationInput: durationInputs,
    });

    setIsLoading(false);
  }, [supabase, router, dateKey, cacheKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate dates
  const goDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  // =========================================
  // HABIT TOGGLE / LOGGING
  // =========================================
  const getEntry = (habitId: string): HabitEntry | undefined =>
    entries.find((e) => e.habit_id === habitId);

  const toggleBoolean = async (habit: Habit) => {
    const existing = getEntry(habit.id);
    const newCompleted = !existing?.completed;

    try {
      if (existing) {
        await supabase
          .from("habit_entries")
          .update({ completed: newCompleted, value: newCompleted ? 1 : 0 })
          .eq("id", existing.id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("habit_entries").insert({
          user_id: user.id,
          habit_id: habit.id,
          entry_date: dateKey,
          value: 1,
          completed: true,
        });
      }

      // Optimistic update
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.habit_id === habit.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            completed: newCompleted,
            value: newCompleted ? 1 : 0,
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: "",
            habit_id: habit.id,
            entry_date: dateKey,
            value: 1,
            completed: true,
            notes: null,
            created_at: new Date().toISOString(),
          },
        ];
      });
    } catch {
      toast.error("Failed to save");
    }
  };

  const updateDuration = (habit: Habit, rawValue: string) => {
    setDurationInput((prev) => ({ ...prev, [habit.id]: rawValue }));

    // Debounce save
    if (debounceTimers.current[habit.id]) {
      clearTimeout(debounceTimers.current[habit.id]);
    }

    debounceTimers.current[habit.id] = setTimeout(async () => {
      const numValue = parseFloat(rawValue) || 0;
      const completed = numValue >= habit.target_value;
      const existing = getEntry(habit.id);

      try {
        if (existing) {
          await supabase
            .from("habit_entries")
            .update({ value: numValue, completed })
            .eq("id", existing.id);
        } else if (numValue > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from("habit_entries").insert({
            user_id: user.id,
            habit_id: habit.id,
            entry_date: dateKey,
            value: numValue,
            completed,
          });
        }

        // Optimistic update
        setEntries((prev) => {
          const idx = prev.findIndex((e) => e.habit_id === habit.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], value: numValue, completed };
            return updated;
          }
          if (numValue > 0) {
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                user_id: "",
                habit_id: habit.id,
                entry_date: dateKey,
                value: numValue,
                completed,
                notes: null,
                created_at: new Date().toISOString(),
              },
            ];
          }
          return prev;
        });
      } catch {
        toast.error("Failed to save");
      }
    }, 600);
  };

  // =========================================
  // FOOD LOGGING
  // =========================================
  const totalCalories = foodLogs.reduce((sum, f) => sum + f.calories, 0);

  const handleAddFood = async () => {
    if (!foodForm.food_name.trim()) {
      setFoodError("Food name is required");
      return;
    }
    const cal = parseInt(foodForm.calories);
    if (!cal || cal <= 0) {
      setFoodError("Enter valid calories");
      return;
    }

    setIsSavingFood(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("food_logs").insert({
        user_id: user.id,
        food_name: foodForm.food_name.trim(),
        calories: cal,
        meal_type: foodForm.meal_type,
        logged_at: new Date(dateKey + "T12:00:00").toISOString(),
      });

      if (error) throw error;

      toast.success("Food logged!");
      setFoodSheetOpen(false);
      setFoodForm((prev) => ({
        food_name: "",
        calories: "",
        meal_type: prev.meal_type, // Remember last meal type
      }));
      setFoodError("");
      fetchData();
    } catch {
      toast.error("Failed to log food");
    } finally {
      setIsSavingFood(false);
    }
  };

  const deleteFood = async (id: string) => {
    try {
      await supabase.from("food_logs").delete().eq("id", id);
      setFoodLogs((prev) => prev.filter((f) => f.id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const quickAddFood = (food: { food_name: string; calories: number }) => {
    setFoodForm({
      food_name: food.food_name,
      calories: String(food.calories),
      meal_type: foodForm.meal_type,
    });
  };

  // =========================================
  // STATS
  // =========================================
  const completedHabits = habits.filter((h) => {
    const entry = getEntry(h.id);
    return entry?.completed;
  }).length;

  return (
    <>
      <TopBar title="Daily Log" />

      <div style={{ padding: "var(--space-4)" }}>
        {/* ========== DATE SELECTOR ========== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-4)",
            marginBottom: "var(--space-5)",
          }}
        >
          <button
            onClick={() => goDay(-1)}
            aria-label="Previous day"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "var(--space-2)",
            }}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div style={{ textAlign: "center", minWidth: "140px" }}>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>
              {displayDate(selectedDate)}
            </span>
            {formatDate(selectedDate) !== formatDate(new Date()) && (
              <button
                onClick={() => setSelectedDate(new Date())}
                style={{
                  display: "block",
                  margin: "2px auto 0",
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Go to today
              </button>
            )}
          </div>
          <button
            onClick={() => goDay(1)}
            aria-label="Next day"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "var(--space-2)",
            }}
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <Skeleton width="22px" height="22px" borderRadius="50%" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height="14px" />
                    <Skeleton width="40%" height="11px" style={{ marginTop: "6px" }} />
                  </div>
                </div>
              </SkeletonCard>
            ))}
            <SkeletonCard style={{ marginTop: "var(--space-2)" }}>
              <Skeleton width="100px" height="14px" />
              <Skeleton width="70%" height="12px" style={{ marginTop: "var(--space-2)" }} />
              <Skeleton width="100%" height="6px" borderRadius="3px" style={{ marginTop: "var(--space-2)" }} />
            </SkeletonCard>
          </div>
        ) : (
          <>
            {/* ========== HABITS SECTION ========== */}
            <section style={{ marginBottom: "var(--space-6)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-3)",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 600 }}>
                  Habits
                </h2>
                <span
                  style={{
                    fontSize: "13px",
                    color: completedHabits === habits.length && habits.length > 0
                      ? "var(--accent-primary)"
                      : "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  {completedHabits}/{habits.length} done
                </span>
              </div>

              {habits.length === 0 ? (
                <Card padding="md">
                  <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
                    {formatDate(selectedDate) === formatDate(new Date()) ? (
                      <>
                        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                          No active habits to track.
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => router.push("/habits")}
                          style={{ height: "36px", fontSize: "13px" }}
                        >
                          Add Habits
                        </Button>
                      </>
                    ) : (
                      <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                        No habits were being tracked on this date.
                      </p>
                    )}
                  </div>
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {habits.map((habit) => {
                    const entry = getEntry(habit.id);
                    const isCompleted = entry?.completed || false;

                    if (habit.tracking_type === "boolean") {
                      return (
                        <Card key={habit.id} padding="md">
                          <button
                            onClick={() => toggleBoolean(habit)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-3)",
                              width: "100%",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              textAlign: "left",
                              fontFamily: "inherit",
                            }}
                          >
                            {/* Toggle circle */}
                            <div
                              style={{
                                transition: "transform 0.15s ease",
                                transform: isCompleted ? "scale(1)" : "scale(1)",
                                flexShrink: 0,
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle
                                  size={28}
                                  weight="fill"
                                  color="var(--accent-primary)"
                                />
                              ) : (
                                <Circle
                                  size={28}
                                  color="var(--divider)"
                                />
                              )}
                            </div>

                            {/* Name */}
                            <div style={{ flex: 1 }}>
                              <span
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 500,
                                  color: isCompleted
                                    ? "var(--text-primary)"
                                    : "var(--text-secondary)",
                                  textDecoration: isCompleted ? "line-through" : "none",
                                  opacity: isCompleted ? 0.7 : 1,
                                }}
                              >
                                {habit.name}
                              </span>
                              {habit.category && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "11px",
                                    color: habit.category.color,
                                    marginTop: "1px",
                                  }}
                                >
                                  {habit.category.name}
                                </span>
                              )}
                            </div>
                          </button>
                        </Card>
                      );
                    }

                    // Duration habit
                    return (
                      <Card key={habit.id} padding="md">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                          }}
                        >
                          {/* Status indicator */}
                          <div style={{ flexShrink: 0 }}>
                            {isCompleted ? (
                              <CheckCircle size={28} weight="fill" color="var(--accent-primary)" />
                            ) : (
                              <Circle size={28} color="var(--divider)" />
                            )}
                          </div>

                          {/* Name + category */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: 500,
                                color: isCompleted
                                  ? "var(--text-primary)"
                                  : "var(--text-secondary)",
                                textDecoration: isCompleted ? "line-through" : "none",
                                opacity: isCompleted ? 0.7 : 1,
                              }}
                            >
                              {habit.name}
                            </span>
                            {habit.category && (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "11px",
                                  color: habit.category.color,
                                  marginTop: "1px",
                                }}
                              >
                                {habit.category.name}
                              </span>
                            )}
                          </div>

                          {/* Duration input - improved UX */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "var(--space-1)",
                              flexShrink: 0,
                            }}
                          >
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={durationInput[habit.id] || ""}
                              onChange={(e) => updateDuration(habit, e.target.value)}
                              style={{
                                width: "70px",
                                height: "38px",
                                textAlign: "center",
                                fontSize: "14px",
                                fontWeight: 700,
                                fontFamily: "inherit",
                                backgroundColor: isCompleted ? "rgba(16, 185, 129, 0.08)" : "var(--bg-tertiary)",
                                border: `2px solid ${
                                  isCompleted
                                    ? "var(--accent-primary)"
                                    : "var(--border-default)"
                                }`,
                                borderRadius: "var(--radius-sm)",
                                color: "var(--text-primary)",
                                outline: "none",
                                transition: "all var(--transition-fast)",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                            >
                              min {habit.target_value} · ideal {habit.unit || "min"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ========== CALORIES SECTION ========== */}
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-3)",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Calories</h2>
                <button
                  onClick={() => setFoodSheetOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  <PlusCircle size={18} weight="bold" />
                  Add Food
                </button>
              </div>

              {/* Calorie Ring + Summary */}
              <Card padding="lg" style={{ marginBottom: "var(--space-3)" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-6)",
                  }}
                >
                  <ProgressRing
                    value={totalCalories}
                    max={calorieTarget}
                    size={110}
                    strokeWidth={10}
                    label="kcal"
                  />
                  <div>
                    <div style={{ marginBottom: "var(--space-2)" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>
                        Consumed
                      </span>
                      <span style={{ fontSize: "20px", fontWeight: 700 }}>
                        {totalCalories}
                      </span>
                    </div>
                    <div style={{ marginBottom: "var(--space-2)" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>
                        Target
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-secondary)" }}>
                        {calorieTarget}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>
                        Remaining
                      </span>
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
                        {calorieTarget - totalCalories >= 0
                          ? calorieTarget - totalCalories
                          : `+${totalCalories - calorieTarget} over`}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Food Log List */}
              {foodLogs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {foodLogs.map((food) => (
                    <Card key={food.id} padding="sm">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-3)",
                          padding: "var(--space-1) 0",
                        }}
                      >
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>
                          {food.meal_type === "breakfast" ? "🌅" :
                           food.meal_type === "lunch" ? "☀️" :
                           food.meal_type === "dinner" ? "🌙" : "🍿"}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "14px", fontWeight: 500 }}>
                            {food.food_name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                            flexShrink: 0,
                          }}
                        >
                          {food.calories} cal
                        </span>
                        <button
                          onClick={() => deleteFood(food.id)}
                          aria-label="Remove food"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-disabled)",
                            padding: "var(--space-1)",
                            flexShrink: 0,
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ========== ADD FOOD BOTTOM SHEET ========== */}
      <BottomSheet
        isOpen={foodSheetOpen}
        onClose={() => {
          setFoodSheetOpen(false);
          setFoodError("");
        }}
        title="Add Food"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Recent foods quick-add */}
          {recentFoods.length > 0 && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "var(--space-2)",
                }}
              >
                Recent
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {recentFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => quickAddFood(food)}
                    type="button"
                    style={{
                      padding: "var(--space-1) var(--space-3)",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    {food.food_name} ({food.calories})
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Food Name"
            placeholder="e.g. Chicken Rice, Apple, Coffee"
            value={foodForm.food_name}
            onChange={(e) => {
              setFoodForm((f) => ({ ...f, food_name: e.target.value }));
              if (foodError) setFoodError("");
            }}
            error={foodError}
            autoFocus
          />

          <Input
            label="Calories"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 350"
            value={foodForm.calories}
            onChange={(e) => {
              setFoodForm((f) => ({ ...f, calories: e.target.value }));
              if (foodError) setFoodError("");
            }}
          />

          {/* Meal type selector */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "var(--space-2)",
              }}
            >
              Meal
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "var(--space-2)",
              }}
            >
              {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFoodForm((f) => ({ ...f, meal_type: value }))}
                    type="button"
                    style={{
                      height: "44px",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${
                        foodForm.meal_type === value
                          ? "var(--accent-primary)"
                          : "var(--border-default)"
                      }`,
                      backgroundColor:
                        foodForm.meal_type === value
                          ? "var(--accent-primary)" + "15"
                          : "var(--bg-primary)",
                      color:
                        foodForm.meal_type === value
                          ? "var(--accent-primary)"
                          : "var(--text-muted)",
                      fontSize: "13px",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleAddFood}
            isLoading={isSavingFood}
          >
            Log Food
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
