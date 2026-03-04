-- ================================================
-- IShapeMyDays — Supabase Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================

-- ================================================
-- 1. PROFILES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  image_url   TEXT,
  email       TEXT,
  phone       TEXT,
  profession  TEXT,
  bio         TEXT,
  goal        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: Users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);


-- ================================================
-- 2. CATEGORIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'Circle',
  color       TEXT NOT NULL DEFAULT '#10B981',
  "order"     INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- RLS: All CRUD scoped to user_id
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- 3. HABITS TABLE
-- ================================================
CREATE TYPE tracking_type AS ENUM ('boolean', 'duration');

CREATE TABLE IF NOT EXISTS habits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  tracking_type   tracking_type NOT NULL DEFAULT 'boolean',
  target_value    NUMERIC NOT NULL DEFAULT 1,
  unit            TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_habits_user_category ON habits(user_id, category_id);

-- RLS: Scoped to user_id
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- 4. HABIT ENTRIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS habit_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id    UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL,
  value       NUMERIC NOT NULL DEFAULT 0,
  completed   BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Prevent duplicate entries for same habit on same day
  UNIQUE (habit_id, entry_date)
);

CREATE INDEX idx_habit_entries_user_date ON habit_entries(user_id, entry_date);

-- RLS: Scoped to user_id
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habit entries"
  ON habit_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit entries"
  ON habit_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit entries"
  ON habit_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit entries"
  ON habit_entries FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- 5. FOOD LOGS TABLE
-- ================================================
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TABLE IF NOT EXISTS food_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name   TEXT NOT NULL,
  calories    INTEGER NOT NULL CHECK (calories >= 0),
  meal_type   meal_type NOT NULL DEFAULT 'snack',
  logged_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, created_at);

-- RLS: Scoped to user_id
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food logs"
  ON food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs"
  ON food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs"
  ON food_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs"
  ON food_logs FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- 6. CALORIE SETTINGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS calorie_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_target  INTEGER NOT NULL DEFAULT 2000 CHECK (daily_target > 0),
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: Scoped to user_id
ALTER TABLE calorie_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calorie settings"
  ON calorie_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calorie settings"
  ON calorie_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calorie settings"
  ON calorie_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calorie settings"
  ON calorie_settings FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- 7. REPORTS TABLE
-- ================================================
CREATE TYPE report_type AS ENUM ('weekly', 'monthly');

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        report_type NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_reports_user_type ON reports(user_id, type);

-- RLS: Scoped to user_id
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- DONE! All tables created with RLS enabled.
-- ================================================
