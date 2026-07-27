import { connectDB } from "./mongodb";
import {
    ProfileModel,
    CategoryModel,
    HabitModel,
    HabitEntryModel,
    FoodLogModel,
    CalorieSettingModel,
} from "./models";
import type { Category, Habit, HabitEntry, FoodLog, Profile, CalorieSetting } from "@/lib/types/database";

const USER_ID = "user-1";

// =========================================
// HELPERS — map Mongoose docs to app types
// =========================================

function toProfile(doc: any): Profile {
    return {
        id: doc._id.toString(),
        name: doc.name,
        image_url: doc.imageUrl ?? null,
        email: doc.email,
        phone: doc.phone ?? null,
        profession: doc.profession ?? null,
        bio: doc.bio ?? null,
        goal: doc.goal ?? null,
        created_at: doc.createdAt,
    };
}

function toCategory(doc: any): Category {
    return {
        id: doc._id.toString(),
        user_id: doc.userId,
        name: doc.name,
        icon: doc.icon,
        color: doc.color,
        order: doc.order,
        active: doc.active,
        created_at: doc.createdAt,
    };
}

function toHabit(doc: any): Habit {
    return {
        id: doc._id.toString(),
        user_id: doc.userId,
        category_id: doc.categoryId,
        name: doc.name,
        tracking_type: doc.trackingType,
        target_value: doc.targetValue,
        unit: doc.unit ?? null,
        active: doc.active,
        created_at: doc.createdAt,
        deleted_at: doc.deletedAt ?? null,
    };
}

function toHabitEntry(doc: any): HabitEntry {
    return {
        id: doc._id.toString(),
        user_id: doc.userId,
        habit_id: doc.habitId,
        entry_date: doc.entryDate,
        value: doc.value,
        completed: doc.completed,
        notes: doc.notes ?? null,
        created_at: doc.createdAt,
    };
}

function toFoodLog(doc: any): FoodLog {
    return {
        id: doc._id.toString(),
        user_id: doc.userId,
        food_name: doc.foodName,
        calories: doc.calories,
        meal_type: doc.mealType,
        logged_at: doc.loggedAt,
        created_at: doc.createdAt,
    };
}

function toCalorieSetting(doc: any): CalorieSetting {
    return {
        id: doc._id.toString(),
        user_id: doc.userId,
        daily_target: doc.dailyTarget,
        updated_at: doc.updatedAt,
    };
}



// =========================================
// PROFILE
// =========================================

export async function getProfile(): Promise<Profile> {
    await connectDB();
    // Create a blank profile on first visit if none exists
    const doc = await ProfileModel.findOneAndUpdate(
        { userId: USER_ID },
        { $setOnInsert: { userId: USER_ID, name: "", email: "", createdAt: new Date().toISOString() } },
        { upsert: true, returnDocument: 'after' }
    );
    return toProfile(doc!);
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
    await connectDB();
    const mongoUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) mongoUpdates.name = updates.name;
    if (updates.image_url !== undefined) mongoUpdates.imageUrl = updates.image_url;
    if (updates.email !== undefined) mongoUpdates.email = updates.email;
    if (updates.phone !== undefined) mongoUpdates.phone = updates.phone;
    if (updates.profession !== undefined) mongoUpdates.profession = updates.profession;
    if (updates.bio !== undefined) mongoUpdates.bio = updates.bio;
    if (updates.goal !== undefined) mongoUpdates.goal = updates.goal;

    const doc = await ProfileModel.findOneAndUpdate(
        { userId: USER_ID },
        { $set: mongoUpdates },
        { returnDocument: 'after' }
    );
    return toProfile(doc!);
}

// =========================================
// CATEGORIES
// =========================================

export async function getCategories(): Promise<Category[]> {
    await connectDB();
    const docs = await CategoryModel.find({ userId: USER_ID }).sort({ order: 1 });
    return docs.map(toCategory);
}

export async function addCategory(category: Omit<Category, "id" | "user_id" | "created_at">): Promise<Category> {
    await connectDB();
    const doc = await CategoryModel.create({
        userId: USER_ID,
        name: category.name,
        icon: category.icon,
        color: category.color,
        order: category.order,
        active: category.active,
        createdAt: new Date().toISOString(),
    });
    return toCategory(doc);
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    await connectDB();
    const mongoUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) mongoUpdates.name = updates.name;
    if (updates.icon !== undefined) mongoUpdates.icon = updates.icon;
    if (updates.color !== undefined) mongoUpdates.color = updates.color;
    if (updates.order !== undefined) mongoUpdates.order = updates.order;
    if (updates.active !== undefined) mongoUpdates.active = updates.active;

    const doc = await CategoryModel.findByIdAndUpdate(id, { $set: mongoUpdates }, { returnDocument: 'after' });
    return doc ? toCategory(doc) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
    await connectDB();
    await CategoryModel.findByIdAndDelete(id);
    return true;
}

// =========================================
// HABITS
// =========================================

export async function getHabits(): Promise<Habit[]> {
    await connectDB();
    const docs = await HabitModel.find({ userId: USER_ID, deletedAt: null });
    return docs.map(toHabit);
}

export async function getAllHabitsIncludeDeleted(): Promise<Habit[]> {
    await connectDB();
    const docs = await HabitModel.find({ userId: USER_ID });
    return docs.map(toHabit);
}

export async function addHabit(habit: Omit<Habit, "id" | "user_id" | "created_at" | "deleted_at">): Promise<Habit> {
    await connectDB();
    const doc = await HabitModel.create({
        userId: USER_ID,
        categoryId: habit.category_id,
        name: habit.name,
        trackingType: habit.tracking_type,
        targetValue: habit.target_value,
        unit: habit.unit ?? null,
        active: habit.active,
        createdAt: new Date().toISOString(),
        deletedAt: null,
    });
    return toHabit(doc);
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null> {
    await connectDB();
    const mongoUpdates: Record<string, unknown> = {};
    if (updates.category_id !== undefined) mongoUpdates.categoryId = updates.category_id;
    if (updates.name !== undefined) mongoUpdates.name = updates.name;
    if (updates.tracking_type !== undefined) mongoUpdates.trackingType = updates.tracking_type;
    if (updates.target_value !== undefined) mongoUpdates.targetValue = updates.target_value;
    if (updates.unit !== undefined) mongoUpdates.unit = updates.unit;
    if (updates.active !== undefined) mongoUpdates.active = updates.active;

    const doc = await HabitModel.findByIdAndUpdate(id, { $set: mongoUpdates }, { returnDocument: 'after' });
    return doc ? toHabit(doc) : null;
}

export async function deleteHabit(id: string): Promise<boolean> {
    await connectDB();
    await HabitModel.findByIdAndUpdate(id, {
        $set: { deletedAt: new Date().toISOString(), active: false },
    });
    return true;
}

// =========================================
// HABIT ENTRIES
// =========================================

export async function getHabitEntries(dateStr?: string): Promise<HabitEntry[]> {
    await connectDB();
    const query: Record<string, unknown> = { userId: USER_ID };
    if (dateStr) query.entryDate = dateStr;
    const docs = await HabitEntryModel.find(query);
    return docs.map(toHabitEntry);
}

export async function toggleHabitEntry(
    habitId: string,
    dateStr: string,
    completed: boolean,
    value = 1
): Promise<HabitEntry> {
    await connectDB();
    const doc = await HabitEntryModel.findOneAndUpdate(
        { userId: USER_ID, habitId, entryDate: dateStr },
        {
            $set: { completed, value, createdAt: new Date().toISOString() },
            $setOnInsert: { userId: USER_ID, habitId, entryDate: dateStr },
        },
        { upsert: true, returnDocument: 'after' }
    );
    return toHabitEntry(doc!);
}

// =========================================
// FOOD LOGS
// =========================================

export async function getFoodLogs(dateStr?: string): Promise<FoodLog[]> {
    await connectDB();
    const query: Record<string, unknown> = { userId: USER_ID };
    if (dateStr) query.loggedAt = { $regex: `^${dateStr}` };
    const docs = await FoodLogModel.find(query).sort({ loggedAt: -1 });
    return docs.map(toFoodLog);
}

export async function addFoodLog(log: Omit<FoodLog, "id" | "user_id" | "created_at">): Promise<FoodLog> {
    await connectDB();
    const doc = await FoodLogModel.create({
        userId: USER_ID,
        foodName: log.food_name,
        calories: log.calories,
        mealType: log.meal_type,
        loggedAt: log.logged_at,
        createdAt: new Date().toISOString(),
    });
    return toFoodLog(doc);
}

export async function deleteFoodLog(id: string): Promise<boolean> {
    await connectDB();
    await FoodLogModel.findByIdAndDelete(id);
    return true;
}

// =========================================
// CALORIE SETTINGS
// =========================================

export async function getCalorieSetting(): Promise<CalorieSetting> {
    await connectDB();
    const doc = await CalorieSettingModel.findOne({ userId: USER_ID });
    if (!doc) {
        const created = await CalorieSettingModel.create({
            userId: USER_ID,
            dailyTarget: 2200,
            updatedAt: new Date().toISOString(),
        });
        return toCalorieSetting(created);
    }
    return toCalorieSetting(doc);
}

export async function updateCalorieSetting(dailyTarget: number): Promise<CalorieSetting> {
    await connectDB();
    const doc = await CalorieSettingModel.findOneAndUpdate(
        { userId: USER_ID },
        { $set: { dailyTarget, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after', upsert: true }
    );
    return toCalorieSetting(doc!);
}
