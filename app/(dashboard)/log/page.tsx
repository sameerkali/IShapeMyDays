"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  CaretLeft, CaretRight, PlusCircle, CheckCircle, Circle, Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Habit, HabitEntry, FoodLog, Category } from "@/lib/types/database";
import { fetchLogPageData, actionToggleHabitEntry, actionAddFoodLog, actionDeleteFoodLog } from "@/lib/server/actions";

const APP_START_DATE = "2026-07-27";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
function displayDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (formatDate(date) === formatDate(today)) return "Today";
  if (formatDate(date) === formatDate(yesterday)) return "Yesterday";
  if (formatDate(date) === formatDate(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_LABELS: Record<MealType, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

type FoodFormData = { food_name: string; calories: string; meal_type: MealType };

export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = formatDate(selectedDate);

  const [habits, setHabits] = useState<(Habit & { category?: Category })[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [isLoading, setIsLoading] = useState(true);
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodForm, setFoodForm] = useState<FoodFormData>({ food_name: "", calories: "", meal_type: "breakfast" });
  const [foodError, setFoodError] = useState("");
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [recentFoods, setRecentFoods] = useState<{ food_name: string; calories: number }[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [durationInput, setDurationInput] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchLogPageData(dateKey);
      const categoryMap = new Map(data.categories.map((c) => [c.id, c]));
      const endOfDay = `${dateKey}T23:59:59.999Z`;
      const visibleHabits = data.habits
        .filter((h) => { const c = h.created_at <= endOfDay; const nd = !h.deleted_at || h.deleted_at > endOfDay; return h.active && c && nd; })
        .map((h) => ({ ...h, category: categoryMap.get(h.category_id) }));
      setHabits(visibleHabits);
      setEntries(data.entries);
      setFoodLogs(data.foodLogs);
      setCalorieTarget(data.calorieTarget);
      const seen = new Set<string>();
      const uniqueRecent = data.recentFoods.filter((f) => { const k = f.food_name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
      setRecentFoods(uniqueRecent);
      const di: Record<string, string> = {};
      data.entries.forEach((e) => { if (e.value > 0) di[e.habit_id] = String(e.value); });
      setDurationInput(di);
    } catch { toast.error("Failed to load logs"); }
    finally { setIsLoading(false); }
  }, [dateKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayStr = formatDate(new Date());
  const isToday = dateKey >= todayStr;
  const isStartDate = dateKey <= APP_START_DATE;

  const goDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const targetKey = formatDate(d);
    if (targetKey < APP_START_DATE || targetKey > todayStr) return;
    setSelectedDate(d);
  };

  const getEntry = (habitId: string): HabitEntry | undefined => entries.find((e) => e.habit_id === habitId);

  const toggleBoolean = async (habit: Habit) => {
    const existing = getEntry(habit.id);
    const newCompleted = !existing?.completed;
    try {
      await actionToggleHabitEntry(habit.id, dateKey, newCompleted, newCompleted ? 1 : 0);
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.habit_id === habit.id);
        if (idx >= 0) { const updated = [...prev]; updated[idx] = { ...updated[idx], completed: newCompleted, value: newCompleted ? 1 : 0 }; return updated; }
        return [...prev, { id: `entry-${Date.now()}`, user_id: "user-1", habit_id: habit.id, entry_date: dateKey, value: 1, completed: true, notes: null, created_at: new Date().toISOString() }];
      });
    } catch { toast.error("Failed to save"); }
  };

  const updateDuration = (habit: Habit, rawValue: string) => {
    setDurationInput((prev) => ({ ...prev, [habit.id]: rawValue }));
    if (debounceTimers.current[habit.id]) clearTimeout(debounceTimers.current[habit.id]);
    debounceTimers.current[habit.id] = setTimeout(async () => {
      const numValue = parseFloat(rawValue) || 0;
      const completed = numValue >= habit.target_value;
      try {
        await actionToggleHabitEntry(habit.id, dateKey, completed, numValue);
        setEntries((prev) => {
          const idx = prev.findIndex((e) => e.habit_id === habit.id);
          if (idx >= 0) { const updated = [...prev]; updated[idx] = { ...updated[idx], value: numValue, completed }; return updated; }
          if (numValue > 0) return [...prev, { id: `entry-${Date.now()}`, user_id: "user-1", habit_id: habit.id, entry_date: dateKey, value: numValue, completed, notes: null, created_at: new Date().toISOString() }];
          return prev;
        });
      } catch { toast.error("Failed to save"); }
    }, 600);
  };

  const totalCalories = foodLogs.reduce((sum, f) => sum + f.calories, 0);

  const handleAddFood = async () => {
    if (!foodForm.food_name.trim()) { setFoodError("Food name is required"); return; }
    const cal = parseInt(foodForm.calories);
    if (!cal || cal <= 0) { setFoodError("Enter valid calories"); return; }
    setIsSavingFood(true);
    try {
      await actionAddFoodLog({ food_name: foodForm.food_name.trim(), calories: cal, meal_type: foodForm.meal_type, logged_at: `${dateKey}T12:00:00` });
      toast.success("Food logged");
      setFoodSheetOpen(false);
      setFoodForm((prev) => ({ food_name: "", calories: "", meal_type: prev.meal_type }));
      setFoodError("");
      fetchData();
    } catch { toast.error("Failed to log food"); }
    finally { setIsSavingFood(false); }
  };

  const deleteFood = async (id: string) => {
    try {
      await actionDeleteFoodLog(id);
      setFoodLogs((prev) => prev.filter((f) => f.id !== id));
      toast.success("Removed");
    } catch { toast.error("Failed to remove"); }
  };

  const completedHabits = habits.filter((h) => getEntry(h.id)?.completed).length;
  const allDone = habits.length > 0 && completedHabits === habits.length;

  const visibleRecent = showAllRecent ? recentFoods : recentFoods.slice(0, 6);
  const overflowCount = recentFoods.length > 6 ? recentFoods.length - 6 : 0;

  return (
    <>
      <TopBar title="Daily Log" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── DATE NAV (Restricted: No dates prior to 27 July 2026) ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <button
            onClick={() => goDay(-1)}
            disabled={isStartDate}
            aria-label="Previous day"
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: isStartDate ? "not-allowed" : "pointer",
              color: isStartDate ? "var(--text-disabled)" : "var(--text-muted)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              opacity: isStartDate ? 0.3 : 1,
            }}
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}>{displayDate(selectedDate)}</span>
            {formatDate(selectedDate) !== formatDate(new Date()) && (
              <button
                onClick={() => setSelectedDate(new Date())}
                style={{ display: "block", margin: "2px auto 0", background: "none", border: "none", color: "var(--text-muted)", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)", textDecoration: "underline" }}
              >
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={() => goDay(1)}
            disabled={isToday}
            aria-label="Next day"
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: isToday ? "not-allowed" : "pointer",
              color: isToday ? "var(--text-disabled)" : "var(--text-muted)",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              opacity: isToday ? 0.3 : 1,
            }}
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* ── HABITS ── */}
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Habits</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: allDone ? "var(--status-success)" : "var(--text-muted)" }}>
                  {completedHabits}/{habits.length}
                </span>
              </div>

              {habits.length === 0 ? (
                <Card padding="md">
                  <div style={{ textAlign: "center", padding: "12px" }}>
                    {formatDate(selectedDate) === formatDate(new Date()) ? (
                      <>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>No habits to track.</p>
                        <Button variant="secondary" onClick={() => router.push("/habits")} style={{ height: "36px", fontSize: "12px" }}>Add Habits</Button>
                      </>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No habits tracked on this date.</p>
                    )}
                  </div>
                </Card>
              ) : (
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  {habits.map((habit, idx) => {
                    const entry = getEntry(habit.id);
                    const isCompleted = entry?.completed || false;

                    if (habit.tracking_type === "boolean") {
                      return (
                        <button
                          key={habit.id}
                          onClick={() => toggleBoolean(habit)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            width: "100%",
                            padding: "14px 16px",
                            background: isCompleted ? "var(--bg-elevated)" : "var(--bg-surface)",
                            border: "none",
                            borderBottom: idx < habits.length - 1 ? "1px solid var(--border)" : "none",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "var(--font)",
                            transition: "background var(--t-fast)",
                          }}
                        >
                          {isCompleted
                            ? <CheckCircle size={22} weight="fill" color="var(--white)" />
                            : <Circle size={22} color="var(--border-strong)" />
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: isCompleted ? "var(--text-muted)" : "var(--text-primary)", textDecoration: isCompleted ? "line-through" : "none", display: "block" }}>
                              {habit.name}
                            </span>
                            {habit.category && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "1px" }}>
                                {habit.category.name}
                              </span>
                            )}
                          </div>
                          {isCompleted && (
                            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--status-success)" }}>Done</span>
                          )}
                        </button>
                      );
                    }

                    // Duration
                    return (
                      <div
                        key={habit.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "14px 16px",
                          backgroundColor: isCompleted ? "var(--bg-elevated)" : "var(--bg-surface)",
                          borderBottom: idx < habits.length - 1 ? "1px solid var(--border)" : "none",
                          transition: "background var(--t-fast)",
                        }}
                      >
                        {isCompleted
                          ? <CheckCircle size={22} weight="fill" color="var(--white)" style={{ flexShrink: 0 }} />
                          : <Circle size={22} color="var(--border-strong)" style={{ flexShrink: 0 }} />
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: isCompleted ? "var(--text-muted)" : "var(--text-primary)", textDecoration: isCompleted ? "line-through" : "none", display: "block" }}>
                            {habit.name}
                          </span>
                          {habit.category && (
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "1px" }}>
                              {habit.category.name}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={durationInput[habit.id] || ""}
                              onChange={(e) => updateDuration(habit, e.target.value)}
                              style={{
                                width: "64px",
                                height: "36px",
                                textAlign: "center",
                                fontSize: "14px",
                                fontWeight: 700,
                                fontFamily: "var(--font)",
                                backgroundColor: "var(--bg-base)",
                                border: `1px solid ${isCompleted ? "var(--white)" : "var(--border-strong)"}`,
                                borderRadius: "var(--radius-sm)",
                                color: "var(--text-primary)",
                                outline: "none",
                              }}
                            />
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>{habit.unit || "min"}</span>
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>target {habit.target_value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── CALORIES ── */}
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Calories</span>
                {/* Highlighted Add Food Button */}
                <button
                  onClick={() => setFoodSheetOpen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "var(--white)",
                    color: "var(--black)",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font)",
                    letterSpacing: "0.01em",
                    boxShadow: "0 2px 8px rgba(255,255,255,0.15)",
                    transition: "transform var(--t-fast)",
                  }}
                >
                  <PlusCircle size={16} weight="bold" /> Add Food
                </button>
              </div>

              {/* Calorie summary */}
              <Card padding="lg" style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px" }}>
                  <ProgressRing value={totalCalories} max={calorieTarget} size={100} strokeWidth={8} label="kcal" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Consumed", value: totalCalories, color: "var(--text-primary)" },
                      { label: "Target", value: calorieTarget, color: "var(--text-muted)" },
                      {
                        label: "Remaining",
                        value: calorieTarget - totalCalories >= 0 ? calorieTarget - totalCalories : `+${totalCalories - calorieTarget} over`,
                        color: calorieTarget - totalCalories >= 0 ? "var(--text-primary)" : "var(--status-error)",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
                        <p style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calorie Overage Warning Banner */}
                {totalCalories > calorieTarget && (
                  <div style={{ marginTop: "16px", padding: "12px 14px", backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--status-error)", marginBottom: "4px" }}>
                      ⚠️ You ate too much! Please control yourself.
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      You exceeded target by +{totalCalories - calorieTarget} kcal today. Deduct ~{Math.round((totalCalories - calorieTarget) / 6)} kcal/day for remaining days this week to balance your weekly budget.
                    </p>
                  </div>
                )}
              </Card>

              {/* Food log list */}
              {foodLogs.length > 0 && (
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  {foodLogs.map((food, idx) => {
                    const mealIcons: Record<string, string> = { breakfast: "B", lunch: "L", dinner: "D", snack: "S" };
                    return (
                      <div
                        key={food.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          backgroundColor: "var(--bg-surface)",
                          borderBottom: idx < foodLogs.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <span style={{ fontSize: "9px", fontWeight: 800, width: "16px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {mealIcons[food.meal_type] || "—"}
                        </span>
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {food.food_name}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                          {food.calories}
                        </span>
                        <button
                          onClick={() => deleteFood(food.id)}
                          aria-label="Remove food"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-disabled)", padding: "4px", display: "flex", alignItems: "center" }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── ADD FOOD SHEET ── */}
      <BottomSheet isOpen={foodSheetOpen} onClose={() => { setFoodSheetOpen(false); setFoodError(""); setShowAllRecent(false); }} title="Add Food">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {recentFoods.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Recent Foods</p>
                {recentFoods.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRecent(!showAllRecent)}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    {showAllRecent ? "Show less" : `+${overflowCount} more`}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {visibleRecent.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => setFoodForm((f) => ({ ...f, food_name: food.food_name, calories: String(food.calories) }))}
                    type="button"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFamily: "var(--font)",
                      cursor: "pointer",
                    }}
                  >
                    {food.food_name} <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>({food.calories})</span>
                  </button>
                ))}

                {!showAllRecent && overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRecent(true)}
                    title={`See ${overflowCount} more recent items`}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      backgroundColor: "var(--bg-hover)",
                      color: "var(--white)",
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "var(--font)",
                      cursor: "pointer",
                    }}
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>
            </div>
          )}

          <Input label="Food Name" placeholder="e.g. Chicken Rice, Apple" value={foodForm.food_name} onChange={(e) => { setFoodForm((f) => ({ ...f, food_name: e.target.value })); if (foodError) setFoodError(""); }} error={foodError} autoFocus />
          <Input label="Calories" type="number" inputMode="numeric" placeholder="350" value={foodForm.calories} onChange={(e) => { setFoodForm((f) => ({ ...f, calories: e.target.value })); if (foodError) setFoodError(""); }} />

          {/* Meal type */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>Meal</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
              {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFoodForm((f) => ({ ...f, meal_type: value }))}
                  type="button"
                  style={{
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${foodForm.meal_type === value ? "var(--white)" : "var(--border-strong)"}`,
                    backgroundColor: foodForm.meal_type === value ? "var(--bg-elevated)" : "transparent",
                    color: foodForm.meal_type === value ? "var(--white)" : "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "var(--font)",
                    cursor: "pointer",
                    transition: "all var(--t-fast)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" fullWidth onClick={handleAddFood} isLoading={isSavingFood}>Log Food</Button>
        </div>
      </BottomSheet>
    </>
  );
}
