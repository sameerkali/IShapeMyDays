# IShapeMyDays — Step-by-Step Implementation Plan

> **Derived from:** PRD, System Design, Design System, Database Schema, API Contract, MVP Tech Doc, Development Phases  
> **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Recharts · Phosphor Icons  
> **Hosting:** Vercel  
> **Current State:** Fresh Next.js boilerplate — no features built yet.

---

## Phase 0 — Project Foundation & Design System

> **Goal:** Establish the design tokens, global styles, folder structure, and all shared dependencies so every future component is consistent from day one.

### Tasks

- [x] **0.1 — Install core dependencies**
  - `@supabase/supabase-js`, `@supabase/ssr` (auth helpers for Next.js)
  - `recharts` (charting)
  - `@phosphor-icons/react` (icon library — the ONLY one allowed)
  - `react-hot-toast` or `sonner` (toast notifications)
  - → Verify: `npm ls` shows all packages installed, `npm run build` passes

- [x] **0.2 — Set up project folder structure**
  ```
  app/
  ├── (auth)/            # Auth-related pages (login, verify, profile-setup)
  ├── (dashboard)/       # Protected app shell (dashboard, log, analytics, profile)
  ├── api/               # Next.js API routes (if needed alongside Supabase)
  ├── layout.tsx         # Root layout
  └── globals.css        # Global styles & design tokens
  lib/
  ├── supabase/
  │   ├── client.ts      # Browser Supabase client
  │   ├── server.ts      # Server Supabase client
  │   └── middleware.ts   # Auth middleware helper
  ├── types/
  │   └── database.ts    # TypeScript types matching Supabase schema
  └── utils/             # Shared utility functions
  components/
  ├── ui/                # Atomic UI (Button, Card, Input, ProgressRing, etc.)
  ├── layout/            # Shell, BottomNav, TopBar
  └── features/          # Domain-specific (HabitCard, CalorieRing, etc.)
  ```
  → Verify: Folders exist, `npm run dev` still works

- [x] **0.3 — Implement Design Tokens in `globals.css`**
  - CSS custom properties for all colors from `design_system.md`:
    - Backgrounds: `--bg-primary: #0F172A`, `--bg-secondary: #1E293B`, `--bg-tertiary: #334155`
    - Accents: `--accent-primary: #10B981`, `--accent-hover: #059669`, `--accent-secondary: #6366F1`
    - Status: `--success: #22C55E`, `--warning: #F59E0B`, `--error: #EF4444`, `--neutral: #94A3B8`
    - Divider: `--divider: #475569`
  - Typography: Import `Inter` from Google Fonts, set type scale (H1–Caption)
  - Spacing: 8pt grid system variables
  - Border-radius tokens: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`
  → Verify: Open browser, body has `#0F172A` background, Inter font loads

- [x] **0.4 — Build atomic UI component library**
  - `Button` (primary/secondary/danger variants, 48px height, full-width mobile)
  - `Card` (bg `#1E293B`, 16px radius, 1px border `#334155`)
  - `Input` (bg `#0F172A`, border `#334155`, focus border `#10B981`, 44px height)
  - `Label` (12px uppercase, color `#94A3B8`)
  - `Badge` (status colors)
  → Verify: Create a `/dev` test page to visually inspect all components

- [x] **0.5 — Build Layout Shell & Bottom Navigation**
  - Sticky top bar with page title
  - Bottom tab bar with 4 tabs: Dashboard, Log, Analytics, Profile
  - Phosphor icons: `House`, `CheckCircle`, `ChartLineUp`, `UserCircle` (24px)
  - Active state: Emerald `#10B981` bold weight; Inactive: `#94A3B8` regular weight
  - 8px spacing between icon and label
  → Verify: Navigate between tabs, active state highlights correctly, mobile responsive

---

## Phase 1 — Authentication & Profile Setup

> **Goal:** Users can sign up/login via email OTP and complete their profile. This is the gateway to the entire app.

### Dependencies
- Supabase project must be created with Auth enabled (email OTP provider)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Tasks

- [x] **1.1 — Supabase project setup**
  - Create Supabase project
  - Enable Email OTP auth provider
  - Add env vars to `.env.local`
  - Create Supabase client utilities (`lib/supabase/client.ts` & `lib/supabase/server.ts`)
  → Verify: `supabase.auth.getSession()` returns without error

- [x] **1.2 — Build Login Page** (`app/(auth)/login/page.tsx`)
  - Email input field (design system styled)
  - "Send OTP" primary button
  - Calls `supabase.auth.signInWithOtp({ email })`
  - On success → redirect to OTP verification page
  - Error handling with toast notifications
  → Verify: Entering email triggers OTP email from Supabase

- [x] **1.3 — Build OTP Verification Page** (`app/(auth)/verify/page.tsx`)
  - 6-digit OTP input
  - "Verify" button
  - Calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`
  - On success → check if profile exists:
    - Yes → redirect to `/dashboard`
    - No → redirect to `/profile-setup`
  → Verify: Valid OTP creates session, redirects correctly

- [x] **1.4 — Build Profile Setup Page** (`app/(auth)/profile-setup/page.tsx`)
  - Form fields: name (required), email (pre-filled, disabled), phone, profession, bio, goal
  - Image upload placeholder (excluded from MVP per `MVP_tech_doc.md`)
  - "Save & Continue" button
  - Inserts into `profiles` table
  → Verify: Profile saved in Supabase, user redirects to dashboard

- [x] **1.5 — Auth Middleware (Route Protection)**
  - `middleware.ts` at project root
  - Protect all `(dashboard)` routes — redirect to `/login` if no session
  - Redirect authenticated users away from auth pages
  → Verify: Unauthenticated access to `/dashboard` redirects to `/login`

---

## Phase 2 — Database Schema & RLS

> **Goal:** All tables created with Row Level Security policies enforcing strict user isolation.

### Tasks

- [ ] **2.1 — Create `profiles` table**
  - Fields: `id` (uuid PK → auth.uid), `name`, `image_url`, `email`, `phone`, `profession`, `bio`, `goal`, `created_at`
  - RLS: Users can only SELECT/UPDATE their own row
  - Trigger: Auto-create profile row on auth signup (optional)
  → Verify: Insert a profile, attempt cross-user SELECT → denied

- [ ] **2.2 — Create `categories` table**
  - Fields: `id` (uuid), `user_id` (uuid → auth.uid), `name`, `icon`, `color`, `order` (int), `active` (bool), `created_at`
  - Index: `user_id`
  - RLS: All CRUD scoped to `user_id = auth.uid()`
  → Verify: RLS test — user A cannot see user B's categories

- [ ] **2.3 — Create `habits` table**
  - Fields: `id`, `user_id`, `category_id` (FK → categories), `name`, `tracking_type` (boolean | duration), `target_value`, `unit`, `active`, `created_at`
  - Index: `(user_id, category_id)`
  - RLS: Scoped to `user_id = auth.uid()`
  → Verify: Habit links to correct category, RLS enforced

- [ ] **2.4 — Create `habit_entries` table**
  - Fields: `id`, `user_id`, `habit_id` (FK → habits), `entry_date` (date), `value` (numeric), `completed` (bool), `notes`, `created_at`
  - Index: `(user_id, entry_date)` (critical for daily queries)
  - RLS: Scoped to user
  → Verify: Query entries by date returns only user's data

- [ ] **2.5 — Create `food_logs` table**
  - Fields: `id`, `user_id`, `food_name`, `calories` (int), `meal_type` (breakfast/lunch/dinner/snack), `logged_at` (timestamp), `created_at`
  - Index: `(user_id, created_at)`
  - RLS: Scoped to user
  → Verify: Log food, query by date range works

- [ ] **2.6 — Create `calorie_settings` table**
  - Fields: `id`, `user_id` (unique), `daily_target` (int), `updated_at`
  - RLS: Scoped to user
  → Verify: Each user has one calorie target row

- [ ] **2.7 — Create TypeScript types** (`lib/types/database.ts`)
  - Generate types from Supabase CLI: `npx supabase gen types typescript`
  - Or manually define interfaces matching all tables
  → Verify: Types used in components without TS errors

---

## Phase 3 — Category & Habit CRUD

> **Goal:** Users can create, read, update, and delete categories and habits — the core data structure of the app.

### Tasks

- [ ] **3.1 — Categories List Page** (`app/(dashboard)/categories/page.tsx`)
  - Fetch all categories for current user (sorted by `order`)
  - Display as cards with icon, name, color indicator, active/inactive badge
  - "Add Category" FAB (PlusCircle icon)
  → Verify: Categories load from Supabase, empty state shown for new users

- [ ] **3.2 — Create/Edit Category Bottom Sheet**
  - Fields: name, icon picker (Phosphor subset), color picker, order
  - Create: `POST /categories` → insert into Supabase
  - Edit: `PATCH /categories/:id` → update in Supabase
  - Delete: confirmation dialog → `DELETE /categories/:id`
  → Verify: Create → appears in list; Edit → changes reflect; Delete → removed

- [ ] **3.3 — Habits List Page** (`app/(dashboard)/habits/page.tsx`)
  - Grouped by category
  - Each habit shows: name, tracking type icon, target value
  - Filter by category
  - "Add Habit" button
  → Verify: Habits display under correct categories

- [ ] **3.4 — Create/Edit Habit Bottom Sheet**
  - Fields: name, category (dropdown), tracking type (boolean/duration), target value, unit
  - Validation: name required, category required, target > 0 for duration
  → Verify: Habit created with correct category association, tracking type displays properly

---

## Phase 4 — Daily Logging

> **Goal:** The core daily UX — users log habits and food in under 2 minutes (per UX rule in design system).

### Tasks

- [ ] **4.1 — Daily Log Page** (`app/(dashboard)/log/page.tsx`)
  - Date selector at top (today by default, can navigate ±)
  - Two sections: **Habits** and **Calories**
  - Habits section:
    - List all active habits for the day
    - Boolean habits: toggle circle (filled `#10B981` / outlined `#475569`)
    - Duration habits: tap to enter value
  - Auto-save on toggle/input
  → Verify: Toggle a habit → `habit_entries` row created/updated in Supabase

- [ ] **4.2 — Habit Completion Dots UI**
  - Design system spec: filled circle `#10B981` (completed), outlined circle `#475569` (incomplete)
  - Smooth toggle transition (scale 0.97 press, color fade)
  - Phosphor `CheckCircle` for completed state
  → Verify: Visual matches design system, animation feels snappy

- [ ] **4.3 — Calorie Logging Section**
  - "Add Food" button opens bottom sheet
  - Fields: food name, calories, meal type (breakfast/lunch/dinner/snack)
  - Show running total vs daily target
  - Pre-fill frequent foods (store user's recent entries)
  - Remember last selected meal type
  → Verify: Add food → total updates, persists in `food_logs` table

- [ ] **4.4 — Calorie Progress Ring**
  - Circular progress indicator (design system §7.5)
  - Dark track `#334155`, progress fill `#10B981`
  - Bold number in center showing consumed/target
  - Overeat state: ring turns `#EF4444`
  → Verify: Ring animates on data change, correct percentage shown

---

## Phase 5 — Dashboard & Analytics

> **Goal:** A powerful at-a-glance view + deeper analytics for understanding habit patterns.

### Tasks

- [ ] **5.1 — Dashboard Page** (`app/(dashboard)/dashboard/page.tsx`)
  - Today's completion summary (X of Y habits done)
  - Current streak counter (with Fire icon)
  - Calorie ring widget (today)
  - Category-wise mini summary cards
  - Quick action: "Log Today" button → navigates to Log page
  → Verify: Dashboard data matches actual entries for today

- [ ] **5.2 — Analytics Page** (`app/(dashboard)/analytics/page.tsx`)
  - Time range selector: Last 7 days / 30 days
  - **Line Chart** (Recharts): Daily completion % over time
    - Dark grid lines, high contrast data lines
    - Max 4 colors per chart (per design system §9)
  - **Category Performance**: Bar or grouped chart
  - Streaks summary
  → Verify: Chart renders with real data, responsive on mobile

- [ ] **5.3 — Weekly Summary Card**
  - Completion percentage
  - Best streak
  - Most improved habit
  - Category scores
  - Stored in `reports` table as summary JSON
  → Verify: Summary calculates correctly from last 7 days of entries

---

## Phase 6 — Profile & Settings

> **Goal:** Users can view/edit their profile, manage settings, and delete their account.

### Tasks

- [ ] **6.1 — Profile Page** (`app/(dashboard)/profile/page.tsx`)
  - Display per design system §13:
    - Circular avatar (placeholder if no image)
    - Name (bold), Profession (muted `#94A3B8`)
    - Goal in accent-bordered box
    - Weekly score summary card
  - "Edit Profile" button → opens edit form
  - "Logout" button
  → Verify: Profile data loads from Supabase, displays correctly

- [ ] **6.2 — Account Deletion**
  - "Delete Account" danger button in profile settings
  - Confirmation dialog with explicit text input ("DELETE")
  - Cascade deletes all user data (categories, habits, entries, food logs, reports, profile)
  - Signs out user after deletion
  → Verify: All data removed from all tables, user redirected to login

- [ ] **6.3 — Calorie Target Settings**
  - Input to set/update daily calorie target
  - Stored in `calorie_settings` table
  - Default suggested: 2000 kcal
  → Verify: Updated target reflected in progress ring

---

## Phase 7 — Email Reports (Post-MVP Enhancement)

> **Goal:** Automated weekly and monthly email reports sent to users.

### Dependencies
- Resend API key (or Supabase SMTP integration)
- Supabase Edge Functions enabled

### Tasks

- [ ] **7.1 — Email Service Setup**
  - Integrate Resend (`npm install resend` or configure in Edge Function)
  - Create email template (HTML) with brand styling:
    - Dark background matching app theme
    - Emerald accent for highlights
    - Clean typography
  → Verify: Send test email, renders correctly in Gmail/Outlook

- [ ] **7.2 — Weekly Report Edge Function**
  - Supabase Edge Function triggered by cron (every Sunday)
  - For each active user:
    1. Fetch last 7 days of `habit_entries`
    2. Calculate completion %, best streak, most improved habit, category performance
    3. Generate personalized email content
    4. Send via Resend
    5. Store report in `reports` table
  → Verify: Manually invoke function, email received, report stored in DB

- [ ] **7.3 — Monthly Report Edge Function**
  - Same pattern, triggered last day of month
  - Aggregates 30-day data
  - Includes monthly score
  → Verify: Monthly email generated with correct aggregation

- [ ] **7.4 — Reports History Page** (`app/(dashboard)/reports/page.tsx`)
  - List all past reports (weekly/monthly)
  - View report inline or expand card
  - Type badge: "Weekly" / "Monthly"
  → Verify: Reports load from DB, sorted by date descending

---

## Phase 8 — Polish, Performance & Deploy

> **Goal:** Production-ready application with optimized queries, proper indexing, and smooth UX.

### Tasks

- [ ] **8.1 — Performance Optimization**
  - Verify indexes on all tables:
    - `categories(user_id)`
    - `habits(user_id, category_id)`
    - `habit_entries(user_id, entry_date)`
    - `food_logs(user_id, created_at)`
    - `reports(user_id, type)`
  - Add composite index `(user_id, date)` for daily log queries
  - Optimize report aggregation queries (avoid N+1)
  → Verify: Query time < 100ms for daily log fetch

- [ ] **8.2 — Micro-animations & Polish**
  - Button press scale: `transform: scale(0.97)` on active
  - Card fade-in on mount (subtle, not bouncy)
  - Habit toggle transition (smooth color fill)
  - Page transitions (subtle opacity fade)
  - **No heavy motion, no bouncy transitions** (per design system §10)
  → Verify: Interactions feel smooth but not distracting

- [ ] **8.3 — Responsive Design Audit**
  - All pages tested on 375px (iPhone SE) through 1440px (desktop)
  - Max content width: 640px centered on desktop
  - Bottom nav hidden on desktop, side nav alternative (optional)
  - Touch targets: minimum 44px height everywhere
  → Verify: No horizontal scroll, no cut-off text on any screen size

- [ ] **8.4 — Accessibility Check**
  - Contrast ratio ≥ 4.5:1 on all text
  - All interactive elements have 44px minimum tap target
  - No font below 14px for body text
  - Proper aria labels on icon-only buttons
  → Verify: Pass automated a11y audit

- [ ] **8.5 — Error Handling & Edge Cases**
  - Loading states on all data fetches (skeleton cards)
  - Empty states for new users (no categories, no habits, no entries)
  - Network error toasts
  - Optimistic UI updates where possible
  → Verify: Disconnect network → no white screen, graceful error shown



---

## Quick Reference — What's IN vs OUT of MVP

| ✅ IN (MVP)                    | ❌ OUT (Future)                  |
| ------------------------------ | -------------------------------- |
| Email OTP Auth                 | Social login (Google, GitHub)    |
| Profile setup (no image)       | Profile image upload             |
| Category CRUD                  | Category archive logic           |
| Habit CRUD (boolean + duration)| Advanced habit types              |
| Daily logging                  | Offline mode                     |
| Basic calorie logging          | Barcode food scanning            |
| Simple line chart              | Radar chart                      |
| Weekly summary (basic)         | Monthly advanced insights        |
| Dark mode only                 | Light mode toggle                |
| Manual calorie entry           | AI-powered food recognition      |
|                                | AI Insights (indigo card styling)|
|                                | Data export system               |

---

## Key Design Constraints (Never Violate)

1. **Dark mode only** for MVP — no light theme
2. **Phosphor Icons only** — no Lucide, Heroicons, Material, or custom SVGs
3. **Inter font only** — no mixing with other typefaces
4. **Emerald `#10B981` is the primary accent** — not blue, not purple
5. **Mobile-first** — every layout starts at 375px
6. **One primary CTA per screen** — avoid cognitive overload
7. **Daily logging under 2 minutes** — speed is a feature
8. **No animated icons, no bouncy transitions** — calm control aesthetic
9. **8pt spacing grid** — no random margins or padding
10. **RLS on every table** — zero cross-user data leakage

---

> **Start with Phase 0, complete sequentially. Each phase builds on the previous.**  
> **Mark tasks `[x]` as you complete them.**
