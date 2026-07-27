"use server";

import * as db from "./db";
import type { Category, Habit, HabitEntry, FoodLog, Profile, CalorieSetting } from "@/lib/types/database";

export async function fetchDashboardData() {
    try {
        const today = new Date().toISOString().split("T")[0];
        const [
            profile,
            habits,
            categories,
            todayEntries,
            foodLogs,
            calorieSetting,
            allEntries,
        ] = await Promise.all([
            db.getProfile(),
            db.getHabits(),
            db.getCategories(),
            db.getHabitEntries(today),
            db.getFoodLogs(today),
            db.getCalorieSetting(),
            db.getHabitEntries(),
        ]);

        return {
            profile,
            habits,
            categories,
            todayEntries,
            foodLogs,
            calorieTarget: calorieSetting?.daily_target ?? 2000,
            allEntries,
        };
    } catch (err) {
        console.error("Dashboard database fetch error:", err);
        return {
            profile: { id: "demo", name: "", email: "", created_at: new Date().toISOString(), image_url: null, phone: null, profession: null, bio: null, goal: null },
            habits: [],
            categories: [],
            todayEntries: [],
            foodLogs: [],
            calorieTarget: 2000,
            allEntries: [],
        };
    }
}

export async function fetchHabitsPageData() {
    const [habits, categories, allEntries] = await Promise.all([
        db.getHabits(),
        db.getCategories(),
        db.getHabitEntries(),
    ]);

    const counts: Record<string, number> = {};
    allEntries.forEach((e) => {
        counts[e.habit_id] = (counts[e.habit_id] || 0) + 1;
    });

    return { habits, categories, habitEntryCounts: counts };
}

export async function fetchCategoriesPageData() {
    const [categories, habits] = await Promise.all([
        db.getCategories(),
        db.getHabits(),
    ]);
    return { categories, habits };
}

export async function fetchLogPageData(dateStr: string) {
    const [
        habits,
        categories,
        entries,
        foodLogs,
        calorieTarget,
        recentFoods,
    ] = await Promise.all([
        db.getAllHabitsIncludeDeleted(),
        db.getCategories(),
        db.getHabitEntries(dateStr),
        db.getFoodLogs(dateStr),
        db.getCalorieTargetForDate(dateStr),
        db.getFoodLogs(),
    ]);

    return {
        habits,
        categories,
        entries,
        foodLogs,
        calorieTarget,
        recentFoods,
    };
}

export async function fetchAnalyticsPageData() {
    const [
        habits,
        entries,
        categories,
        foodLogs,
        calorieSetting,
        targetHistory,
    ] = await Promise.all([
        db.getAllHabitsIncludeDeleted(),
        db.getHabitEntries(),
        db.getCategories(),
        db.getFoodLogs(),
        db.getCalorieSetting(),
        db.getCalorieTargetHistory(),
    ]);

    return {
        habits,
        entries,
        categories,
        foodLogs,
        currentCalorieTarget: calorieSetting.daily_target,
        targetHistory,
    };
}

export async function fetchProfilePageData() {
    const [profile, calorieSetting, habits, entries] = await Promise.all([
        db.getProfile(),
        db.getCalorieSetting(),
        db.getHabits(),
        db.getHabitEntries(),
    ]);

    return {
        profile,
        calorieTarget: calorieSetting.daily_target,
        habitsCount: habits.length,
        entriesCount: entries.length,
    };
}

// =========================================
// MUTATION ACTIONS
// =========================================

export async function actionUpdateProfile(updates: Partial<Profile>) {
    return await db.updateProfile(updates);
}

export async function actionSaveCategory(category: Omit<Category, "id" | "user_id" | "created_at">, editingId?: string | null) {
    if (editingId) {
        return await db.updateCategory(editingId, category);
    }
    return await db.addCategory(category);
}

export async function actionDeleteCategory(id: string) {
    return await db.deleteCategory(id);
}

export async function actionSaveHabit(habit: Omit<Habit, "id" | "user_id" | "created_at" | "deleted_at">, editingId?: string | null) {
    if (editingId) {
        return await db.updateHabit(editingId, habit);
    }
    return await db.addHabit(habit);
}

export async function actionDeleteHabit(id: string) {
    return await db.deleteHabit(id);
}

export async function actionToggleHabitEntry(habitId: string, dateStr: string, completed: boolean, value = 1) {
    return await db.toggleHabitEntry(habitId, dateStr, completed, value);
}

export async function actionAddFoodLog(log: Omit<FoodLog, "id" | "user_id" | "created_at">) {
    return await db.addFoodLog(log);
}

export async function actionDeleteFoodLog(id: string) {
    return await db.deleteFoodLog(id);
}

export async function actionUpdateCalorieTarget(target: number) {
    return await db.updateCalorieSetting(target);
}
