import mongoose, { Schema, model, models, Document } from "mongoose";

// =========================================
// PROFILE
// =========================================
export interface IProfile extends Document {
    userId: string;
    name: string;
    imageUrl: string | null;
    email: string;
    phone: string | null;
    profession: string | null;
    bio: string | null;
    goal: string | null;
    createdAt: string;
}

const ProfileSchema = new Schema<IProfile>({
    userId: { type: String, required: true, unique: true, default: "user-1" },
    name: { type: String, required: true },
    imageUrl: { type: String, default: null },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    profession: { type: String, default: null },
    bio: { type: String, default: null },
    goal: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

export const ProfileModel = models.Profile || model<IProfile>("Profile", ProfileSchema);

// =========================================
// CATEGORY
// =========================================
export interface ICategory extends Document {
    userId: string;
    name: string;
    icon: string;
    color: string;
    order: number;
    active: boolean;
    createdAt: string;
}

const CategorySchema = new Schema<ICategory>({
    userId: { type: String, required: true, default: "user-1" },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    order: { type: Number, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

export const CategoryModel = models.Category || model<ICategory>("Category", CategorySchema);

// =========================================
// HABIT
// =========================================
export interface IHabit extends Document {
    userId: string;
    categoryId: string;
    name: string;
    trackingType: "boolean" | "duration";
    targetValue: number;
    unit: string | null;
    active: boolean;
    createdAt: string;
    deletedAt: string | null;
}

const HabitSchema = new Schema<IHabit>({
    userId: { type: String, required: true, default: "user-1" },
    categoryId: { type: String, required: true },
    name: { type: String, required: true },
    trackingType: { type: String, enum: ["boolean", "duration"], required: true },
    targetValue: { type: Number, required: true },
    unit: { type: String, default: null },
    active: { type: Boolean, default: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    deletedAt: { type: String, default: null },
}, { versionKey: false });

export const HabitModel = models.Habit || model<IHabit>("Habit", HabitSchema);

// =========================================
// HABIT ENTRY
// =========================================
export interface IHabitEntry extends Document {
    userId: string;
    habitId: string;
    entryDate: string;
    value: number;
    completed: boolean;
    notes: string | null;
    createdAt: string;
}

const HabitEntrySchema = new Schema<IHabitEntry>({
    userId: { type: String, required: true, default: "user-1" },
    habitId: { type: String, required: true },
    entryDate: { type: String, required: true },
    value: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    notes: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

HabitEntrySchema.index({ habitId: 1, entryDate: 1 }, { unique: true });

export const HabitEntryModel = models.HabitEntry || model<IHabitEntry>("HabitEntry", HabitEntrySchema);

// =========================================
// FOOD LOG
// =========================================
export interface IFoodLog extends Document {
    userId: string;
    foodName: string;
    calories: number;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    loggedAt: string;
    createdAt: string;
}

const FoodLogSchema = new Schema<IFoodLog>({
    userId: { type: String, required: true, default: "user-1" },
    foodName: { type: String, required: true },
    calories: { type: Number, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    loggedAt: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

export const FoodLogModel = models.FoodLog || model<IFoodLog>("FoodLog", FoodLogSchema);

// =========================================
// CALORIE SETTING
// =========================================
export interface ICalorieSetting extends Document {
    userId: string;
    dailyTarget: number;
    updatedAt: string;
}

const CalorieSettingSchema = new Schema<ICalorieSetting>({
    userId: { type: String, required: true, unique: true, default: "user-1" },
    dailyTarget: { type: Number, default: 2200 },
    updatedAt: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

export const CalorieSettingModel = models.CalorieSetting || model<ICalorieSetting>("CalorieSetting", CalorieSettingSchema);

// =========================================
// CALORIE TARGET HISTORY
// =========================================
export interface ICalorieTargetHistory extends Document {
    userId: string;
    dailyTarget: number;
    effectiveFrom: string; // YYYY-MM-DD
    createdAt: string;
}

const CalorieTargetHistorySchema = new Schema<ICalorieTargetHistory>({
    userId: { type: String, required: true, default: "user-1" },
    dailyTarget: { type: Number, required: true },
    effectiveFrom: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

CalorieTargetHistorySchema.index({ userId: 1, effectiveFrom: -1 });

export const CalorieTargetHistoryModel =
    models.CalorieTargetHistory || model<ICalorieTargetHistory>("CalorieTargetHistory", CalorieTargetHistorySchema);

