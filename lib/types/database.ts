/* ================================================
   IShapeMyDays — Database TypeScript Types
   Source: Engineerig/database_schema.md
   ================================================ */

export type Profile = {
    id: string;
    name: string;
    image_url: string | null;
    email: string;
    phone: string | null;
    profession: string | null;
    bio: string | null;
    goal: string | null;
    created_at: string;
};

export type Category = {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    order: number;
    active: boolean;
    created_at: string;
};

export type TrackingType = "boolean" | "duration";

export type Habit = {
    id: string;
    user_id: string;
    category_id: string;
    name: string;
    tracking_type: TrackingType;
    target_value: number;
    unit: string | null;
    active: boolean;
    created_at: string;
};

export type HabitEntry = {
    id: string;
    user_id: string;
    habit_id: string;
    entry_date: string;
    value: number;
    completed: boolean;
    notes: string | null;
    created_at: string;
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodLog = {
    id: string;
    user_id: string;
    food_name: string;
    calories: number;
    meal_type: MealType;
    logged_at: string;
    created_at: string;
};

export type CalorieSetting = {
    id: string;
    user_id: string;
    daily_target: number;
    updated_at: string;
};

export type ReportType = "weekly" | "monthly";

export type Report = {
    id: string;
    user_id: string;
    type: ReportType;
    data: Record<string, unknown>;
    created_at: string;
};
