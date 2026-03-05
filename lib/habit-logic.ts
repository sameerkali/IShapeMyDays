/**
 * Pure business logic for habit history and analytics.
 * Extracted from page components for testability.
 */

import type { Habit, HabitEntry } from '@/lib/types/database'

// =========================================
// DATE HELPERS
// =========================================

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
}

export function displayDate(date: Date): string {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    if (formatDate(date) === formatDate(today)) return 'Today'
    if (formatDate(date) === formatDate(yesterday)) return 'Yesterday'
    if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow'

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

// =========================================
// HABIT VISIBILITY LOGIC
// =========================================

/**
 * Determines which habits were active on a given date.
 * A habit is considered active on a date if:
 *   - It was created on or before that date
 *   - It was not deleted before or on that date
 *   - Its `active` flag is true
 */
export function getActiveHabitsForDate(habits: Habit[], dateStr: string): Habit[] {
    const endOfDay = `${dateStr}T23:59:59.999Z`
    return habits.filter((h) => {
        const createdBefore = h.created_at <= endOfDay
        const notDeletedYet = !h.deleted_at || h.deleted_at > endOfDay
        return h.active && createdBefore && notDeletedYet
    })
}

/**
 * Determines if a habit should be visible on a specific date in the log.
 * Similar to getActiveHabitsForDate but for a single habit.
 */
export function isHabitVisibleOnDate(habit: Habit, dateStr: string): boolean {
    const endOfDay = `${dateStr}T23:59:59.999Z`
    const createdBefore = habit.created_at <= endOfDay
    const notDeletedYet = !habit.deleted_at || habit.deleted_at > endOfDay
    return habit.active && createdBefore && notDeletedYet
}

// =========================================
// ANALYTICS CALCULATIONS
// =========================================

export type DailyDataPoint = {
    date: string
    label: string
    pct: number
    completed: number
    total: number
}

/**
 * Calculate daily completion percentage, using per-day habit counting.
 */
export function calculateDailyCompletion(
    habits: Habit[],
    entries: HabitEntry[],
    rangeDays: number,
): DailyDataPoint[] {
    const data: DailyDataPoint[] = []

    for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = formatDate(d)
        const dayActiveHabits = getActiveHabitsForDate(habits, key)
        const dayActiveIds = new Set(dayActiveHabits.map((h) => h.id))
        const dayEntries = entries.filter(
            (e) => e.entry_date === key && e.completed && dayActiveIds.has(e.habit_id),
        )
        const completedCount = dayEntries.length
        const total = dayActiveHabits.length
        const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0

        data.push({
            date: key,
            label: key,
            pct,
            completed: completedCount,
            total,
        })
    }

    return data
}

/**
 * Calculate streak (consecutive days with 100% completion).
 */
export function calculateCurrentStreak(
    habits: Habit[],
    entries: HabitEntry[],
): number {
    const todayKey = formatDate(new Date())
    const todayHabits = getActiveHabitsForDate(habits, todayKey)

    if (todayHabits.length === 0) return 0

    const todayEntries = entries.filter((e) => e.entry_date === todayKey && e.completed)
    const d = new Date()
    if (todayEntries.length < todayHabits.length) d.setDate(d.getDate() - 1)

    let streak = 0
    while (true) {
        const key = formatDate(d)
        const dayHabits = getActiveHabitsForDate(habits, key)
        if (dayHabits.length === 0) break

        const dayCompleted = entries.filter((e) => e.entry_date === key && e.completed).length
        if (dayCompleted >= dayHabits.length) {
            streak++
            d.setDate(d.getDate() - 1)
        } else {
            break
        }
    }

    return streak
}

/**
 * Calculate the number of days a habit was active within a range.
 */
export function getHabitActiveDays(habit: Habit, rangeDays: number): number {
    let activeDays = 0
    for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = formatDate(d)
        const endOfDay = `${key}T23:59:59.999Z`
        const wasActive = habit.created_at <= endOfDay && (!habit.deleted_at || habit.deleted_at > endOfDay)
        if (wasActive) activeDays++
    }
    return activeDays
}

// =========================================
// SOFT-DELETE HELPERS
// =========================================

/**
 * Check if a habit has log entries (used to decide soft vs hard delete).
 */
export function habitHasEntries(
    habitId: string,
    entryCounts: Record<string, number>,
): boolean {
    return (entryCounts[habitId] || 0) > 0
}

/**
 * Determines if a habit can be edited.
 * Habits with existing entries cannot be edited (to preserve history).
 */
export function canEditHabit(
    habitId: string,
    entryCounts: Record<string, number>,
): boolean {
    return !habitHasEntries(habitId, entryCounts)
}

/**
 * Check if the selected date is today.
 */
export function isToday(selectedDate: Date): boolean {
    return formatDate(selectedDate) === formatDate(new Date())
}
