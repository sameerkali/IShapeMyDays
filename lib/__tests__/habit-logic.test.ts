import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Habit, HabitEntry } from '@/lib/types/database'
import {
    formatDate,
    displayDate,
    getActiveHabitsForDate,
    isHabitVisibleOnDate,
    calculateDailyCompletion,
    calculateCurrentStreak,
    getHabitActiveDays,
    habitHasEntries,
    canEditHabit,
    isToday,
} from '@/lib/habit-logic'

// =========================================
// FIXTURES
// =========================================

function makeHabit(overrides: Partial<Habit> = {}): Habit {
    return {
        id: 'habit-1',
        user_id: 'user-1',
        category_id: 'cat-1',
        name: 'Test Habit',
        tracking_type: 'boolean',
        target_value: 1,
        unit: null,
        active: true,
        created_at: '2026-03-01T00:00:00.000Z',
        deleted_at: null,
        ...overrides,
    }
}

function makeEntry(overrides: Partial<HabitEntry> = {}): HabitEntry {
    return {
        id: 'entry-1',
        user_id: 'user-1',
        habit_id: 'habit-1',
        entry_date: '2026-03-05',
        value: 1,
        completed: true,
        notes: null,
        created_at: '2026-03-05T12:00:00.000Z',
        ...overrides,
    }
}

// =========================================
// DATE HELPERS
// =========================================

describe('formatDate', () => {
    it('should return YYYY-MM-DD format', () => {
        const date = new Date('2026-03-05T15:30:00Z')
        expect(formatDate(date)).toBe('2026-03-05')
    })

    it('should handle beginning of day', () => {
        const date = new Date('2026-01-01T00:00:00Z')
        expect(formatDate(date)).toBe('2026-01-01')
    })
})

describe('displayDate', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return "Today" for today', () => {
        expect(displayDate(new Date('2026-03-05T12:00:00Z'))).toBe('Today')
    })

    it('should return "Yesterday" for yesterday', () => {
        expect(displayDate(new Date('2026-03-04T12:00:00Z'))).toBe('Yesterday')
    })

    it('should return "Tomorrow" for tomorrow', () => {
        expect(displayDate(new Date('2026-03-06T12:00:00Z'))).toBe('Tomorrow')
    })

    it('should return formatted date for other days', () => {
        const result = displayDate(new Date('2026-03-01T12:00:00Z'))
        expect(result).toContain('Mar')
        expect(result).toContain('1')
    })
})

// =========================================
// HABIT VISIBILITY — Core issue #1
// New habits should NOT appear on past dates
// =========================================

describe('getActiveHabitsForDate', () => {
    it('should NOT show a habit on a date BEFORE it was created', () => {
        const habit = makeHabit({ created_at: '2026-03-05T10:00:00.000Z' })
        const result = getActiveHabitsForDate([habit], '2026-03-04')
        expect(result).toHaveLength(0)
    })

    it('should show a habit on the same date it was created', () => {
        const habit = makeHabit({ created_at: '2026-03-05T10:00:00.000Z' })
        const result = getActiveHabitsForDate([habit], '2026-03-05')
        expect(result).toHaveLength(1)
    })

    it('should show a habit on dates after creation', () => {
        const habit = makeHabit({ created_at: '2026-03-01T00:00:00.000Z' })
        const result = getActiveHabitsForDate([habit], '2026-03-05')
        expect(result).toHaveLength(1)
    })

    it('should NOT show inactive habits', () => {
        const habit = makeHabit({ active: false })
        const result = getActiveHabitsForDate([habit], '2026-03-05')
        expect(result).toHaveLength(0)
    })

    // Core issue #2: Deleted habits should NOT appear after deletion date
    it('should NOT show a soft-deleted habit on dates AFTER deletion', () => {
        const habit = makeHabit({
            created_at: '2026-03-01T00:00:00.000Z',
            deleted_at: '2026-03-03T12:00:00.000Z',
        })
        const result = getActiveHabitsForDate([habit], '2026-03-04')
        expect(result).toHaveLength(0)
    })

    it('should show a soft-deleted habit on dates BEFORE deletion', () => {
        const habit = makeHabit({
            created_at: '2026-03-01T00:00:00.000Z',
            deleted_at: '2026-03-03T12:00:00.000Z',
        })
        const result = getActiveHabitsForDate([habit], '2026-03-02')
        expect(result).toHaveLength(1)
    })

    it('should handle multiple habits with different creation dates', () => {
        const habits = [
            makeHabit({ id: 'h1', created_at: '2026-03-01T00:00:00.000Z' }),
            makeHabit({ id: 'h2', created_at: '2026-03-03T00:00:00.000Z' }),
            makeHabit({ id: 'h3', created_at: '2026-03-05T00:00:00.000Z' }),
        ]

        // On March 2, only h1 should be visible
        expect(getActiveHabitsForDate(habits, '2026-03-02')).toHaveLength(1)
        // On March 4, h1 and h2 should be visible
        expect(getActiveHabitsForDate(habits, '2026-03-04')).toHaveLength(2)
        // On March 5, all three should be visible
        expect(getActiveHabitsForDate(habits, '2026-03-05')).toHaveLength(3)
    })

    it('should handle deleted_at = null correctly', () => {
        const habit = makeHabit({ deleted_at: null })
        const result = getActiveHabitsForDate([habit], '2026-03-10')
        expect(result).toHaveLength(1)
    })
})

describe('isHabitVisibleOnDate', () => {
    it('should match getActiveHabitsForDate behavior', () => {
        const habit = makeHabit({ created_at: '2026-03-05T10:00:00.000Z' })

        expect(isHabitVisibleOnDate(habit, '2026-03-04')).toBe(false)
        expect(isHabitVisibleOnDate(habit, '2026-03-05')).toBe(true)
        expect(isHabitVisibleOnDate(habit, '2026-03-06')).toBe(true)
    })
})

// =========================================
// ANALYTICS — Core issue #3
// Stats should not be corrupted by add/delete/edit
// =========================================

describe('calculateDailyCompletion', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return 0% for days before a habit was created', () => {
        const habit = makeHabit({ created_at: '2026-03-04T00:00:00.000Z' })
        // Range = 3 days (Mar 3, 4, 5). Habit created Mar 4.
        const data = calculateDailyCompletion([habit], [], 3)

        // Mar 3: no habits existed → 0 total → 0%
        expect(data[0].total).toBe(0)
        expect(data[0].pct).toBe(0)

        // Mar 4: habit exists → 1 total
        expect(data[1].total).toBe(1)
        // Mar 5: habit exists → 1 total
        expect(data[2].total).toBe(1)
    })

    it('should not count deleted habit entries after deletion', () => {
        const habit = makeHabit({
            created_at: '2026-03-01T00:00:00.000Z',
            deleted_at: '2026-03-04T00:00:00.000Z',
        })
        const entries: HabitEntry[] = [
            makeEntry({ entry_date: '2026-03-03', completed: true }),
            makeEntry({ entry_date: '2026-03-05', completed: true }), // After deletion
        ]

        const data = calculateDailyCompletion([habit], entries, 5)

        // Mar 3: habit active, 1 completed → 100%
        const mar3 = data.find((d) => d.date === '2026-03-03')
        expect(mar3?.pct).toBe(100)
        expect(mar3?.total).toBe(1)

        // Mar 5: habit deleted → 0 total → 0%
        const mar5 = data.find((d) => d.date === '2026-03-05')
        expect(mar5?.total).toBe(0)
        expect(mar5?.pct).toBe(0)
    })

    it('should calculate correct percentage with multiple habits', () => {
        const habits = [
            makeHabit({ id: 'h1', created_at: '2026-03-01T00:00:00.000Z' }),
            makeHabit({ id: 'h2', created_at: '2026-03-01T00:00:00.000Z' }),
        ]
        const entries: HabitEntry[] = [
            makeEntry({ habit_id: 'h1', entry_date: '2026-03-05', completed: true }),
        ]

        const data = calculateDailyCompletion(habits, entries, 1)
        // 1 of 2 completed = 50%
        expect(data[0].pct).toBe(50)
        expect(data[0].completed).toBe(1)
        expect(data[0].total).toBe(2)
    })
})

// =========================================
// STREAK CALCULATION
// =========================================

describe('calculateCurrentStreak', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return 0 when no habits exist', () => {
        expect(calculateCurrentStreak([], [])).toBe(0)
    })

    it('should count consecutive completed days', () => {
        const habit = makeHabit({ created_at: '2026-03-01T00:00:00.000Z' })
        const entries: HabitEntry[] = [
            makeEntry({ entry_date: '2026-03-05', completed: true }),
            makeEntry({ entry_date: '2026-03-04', completed: true }),
            makeEntry({ entry_date: '2026-03-03', completed: true }),
        ]

        expect(calculateCurrentStreak([habit], entries)).toBe(3)
    })

    it('should break streak on missing day', () => {
        const habit = makeHabit({ created_at: '2026-03-01T00:00:00.000Z' })
        const entries: HabitEntry[] = [
            makeEntry({ entry_date: '2026-03-05', completed: true }),
            // Mar 4 missing
            makeEntry({ entry_date: '2026-03-03', completed: true }),
        ]

        expect(calculateCurrentStreak([habit], entries)).toBe(1)
    })

    it('should handle today incomplete — start counting from yesterday', () => {
        const habit = makeHabit({ created_at: '2026-03-01T00:00:00.000Z' })
        const entries: HabitEntry[] = [
            // Today (Mar 5) not completed
            makeEntry({ entry_date: '2026-03-04', completed: true }),
            makeEntry({ entry_date: '2026-03-03', completed: true }),
        ]

        expect(calculateCurrentStreak([habit], entries)).toBe(2)
    })
})

// =========================================
// HABIT ACTIVE DAYS
// =========================================

describe('getHabitActiveDays', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should count all days for a habit created before the range', () => {
        const habit = makeHabit({ created_at: '2026-02-01T00:00:00.000Z' })
        expect(getHabitActiveDays(habit, 7)).toBe(7)
    })

    it('should count only days after creation for a recently created habit', () => {
        // Created on Mar 3, range 7 days (Feb 27 - Mar 5)
        const habit = makeHabit({ created_at: '2026-03-03T00:00:00.000Z' })
        // Should be active on Mar 3, 4, 5 = 3 days
        expect(getHabitActiveDays(habit, 7)).toBe(3)
    })

    it('should not count days after deletion', () => {
        const habit = makeHabit({
            created_at: '2026-03-01T00:00:00.000Z',
            deleted_at: '2026-03-03T12:00:00.000Z',
        })
        // Active on Mar 1, 2 (deleted on Mar 3 during the day, so Mar 3 includes deletion)
        // Range 7 days = Feb 27 - Mar 5
        // Active: Mar 1, 2 = 2 days (Mar 3 deleted_at is during the day, but we compare deleted_at > endOfDay)
        // deleted_at '2026-03-03T12:00:00.000Z' vs endOfDay '2026-03-03T23:59:59.999Z' → deleted_at < endOfDay → NOT active on Mar 3
        expect(getHabitActiveDays(habit, 7)).toBe(2)
    })
})

// =========================================
// SOFT-DELETE HELPERS
// =========================================

describe('habitHasEntries', () => {
    it('should return true when habit has entries', () => {
        expect(habitHasEntries('h1', { h1: 5 })).toBe(true)
    })

    it('should return false when habit has no entries', () => {
        expect(habitHasEntries('h1', {})).toBe(false)
    })

    it('should return false for zero count', () => {
        expect(habitHasEntries('h1', { h1: 0 })).toBe(false)
    })
})

describe('canEditHabit', () => {
    it('should allow editing habits without entries', () => {
        expect(canEditHabit('h1', {})).toBe(true)
    })

    it('should block editing habits with entries', () => {
        expect(canEditHabit('h1', { h1: 3 })).toBe(false)
    })
})

// =========================================
// isToday
// =========================================

describe('isToday', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return true for today', () => {
        expect(isToday(new Date('2026-03-05T19:00:00Z'))).toBe(true)
    })

    it('should return false for yesterday', () => {
        expect(isToday(new Date('2026-03-04T12:00:00Z'))).toBe(false)
    })
})

// =========================================
// EDGE CASES — Integration-style tests
// =========================================

describe('Edge Cases', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('adding a habit today should NOT inflate past date stats', () => {
        // Habit created today
        const habit = makeHabit({ created_at: '2026-03-05T10:00:00.000Z' })

        // Check past 3 days
        const data = calculateDailyCompletion([habit], [], 3)

        // Mar 3 and 4 should have 0 total (habit didn't exist)
        expect(data[0].total).toBe(0) // Mar 3
        expect(data[1].total).toBe(0) // Mar 4
        expect(data[2].total).toBe(1) // Mar 5 — exists
    })

    it('deleting a habit should preserve stats for dates before deletion', () => {
        const habit = makeHabit({
            created_at: '2026-03-01T00:00:00.000Z',
            deleted_at: '2026-03-04T10:00:00.000Z',
        })
        const entries: HabitEntry[] = [
            makeEntry({ entry_date: '2026-03-02', completed: true }),
            makeEntry({ entry_date: '2026-03-03', completed: true }),
        ]

        const data = calculateDailyCompletion([habit], entries, 5)

        // Mar 2: had 1 habit, 1 completed → 100%
        const mar2 = data.find((d) => d.date === '2026-03-02')
        expect(mar2?.pct).toBe(100)

        // Mar 3: had 1 habit, 1 completed → 100%
        const mar3 = data.find((d) => d.date === '2026-03-03')
        expect(mar3?.pct).toBe(100)

        // Mar 4: deleted during day (deleted_at < endOfDay) → 0 habits → 0%
        const mar4 = data.find((d) => d.date === '2026-03-04')
        expect(mar4?.total).toBe(0)

        // Mar 5: deleted → 0 habits → 0%
        const mar5 = data.find((d) => d.date === '2026-03-05')
        expect(mar5?.total).toBe(0)
    })

    it('a habit created and deleted mid-range should only affect its active window', () => {
        // Created Mar 2, deleted Mar 4
        const habit = makeHabit({
            created_at: '2026-03-02T10:00:00.000Z',
            deleted_at: '2026-03-04T10:00:00.000Z',
        })

        // 5 day range: Mar 1, 2, 3, 4, 5
        const data = calculateDailyCompletion([habit], [], 5)

        // Mar 1: not created yet → 0
        expect(data.find((d) => d.date === '2026-03-01')?.total).toBe(0)
        // Mar 2: active → 1
        expect(data.find((d) => d.date === '2026-03-02')?.total).toBe(1)
        // Mar 3: active → 1
        expect(data.find((d) => d.date === '2026-03-03')?.total).toBe(1)
        // Mar 4: deleted during day → 0
        expect(data.find((d) => d.date === '2026-03-04')?.total).toBe(0)
        // Mar 5: deleted → 0
        expect(data.find((d) => d.date === '2026-03-05')?.total).toBe(0)
    })
})
