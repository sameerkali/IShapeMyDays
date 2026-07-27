import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { fetchDashboardData } from "@/lib/server/actions";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function DashboardPage() {
  const data = await fetchDashboardData();
  const { profile, habits, categories, todayEntries, foodLogs, calorieTarget, allEntries } = data;

  const completedCount = todayEntries.filter((e) => e.completed).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const totalCalories = foodLogs.reduce((sum, f) => sum + f.calories, 0);

  // Streak
  let streak = 0;
  if (totalHabits > 0 && allEntries.length > 0) {
    const entriesByDate = new Map<string, number>();
    allEntries.filter((e) => e.completed).forEach((e) => {
      entriesByDate.set(e.entry_date, (entriesByDate.get(e.entry_date) || 0) + 1);
    });
    const d = new Date();
    const todayComplete = (entriesByDate.get(formatDate(d)) || 0) >= totalHabits;
    if (!todayComplete) d.setDate(d.getDate() - 1);
    while (true) {
      const key = formatDate(d);
      const completedOnDay = entriesByDate.get(key) || 0;
      if (completedOnDay >= totalHabits) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
  }

  // Category summaries
  const categorySummaries = categories
    .map((cat) => {
      const catHabits = habits.filter((h) => h.category_id === cat.id);
      const catCompleted = catHabits.filter((h) =>
        todayEntries.find((e) => e.habit_id === h.id && e.completed)
      ).length;
      return { category: cat, total: catHabits.length, completed: catCompleted };
    })
    .filter((s) => s.total > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.name?.split(" ")[0] || "there";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const calPct = calorieTarget > 0 ? Math.min((totalCalories / calorieTarget) * 100, 100) : 0;

  return (
    <>
      <TopBar title="IShapeMyDays" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── GREETING HEADER ── */}
        <div style={{ paddingTop: "4px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
            {todayFormatted}
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {greeting},<br />{firstName}.
          </h1>
        </div>

        {/* ── HABIT PROGRESS HERO ── */}
        <Card padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <ProgressRing value={completedCount} max={totalHabits || 1} size={100} strokeWidth={8} label="done" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
                Today&apos;s Habits
              </p>
              <div style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {completedCount}<span style={{ fontSize: "20px", color: "var(--text-muted)", fontWeight: 400 }}>/{totalHabits}</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                {completionPct === 100 ? "All done — excellent!" : `${totalHabits - completedCount} remaining`}
              </p>
              {/* Thin progress bar */}
              <div style={{ marginTop: "12px", height: "3px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${completionPct}%`, height: "100%", backgroundColor: "var(--white)", transition: "width 0.6s ease" }} />
              </div>
            </div>
          </div>
        </Card>

        {/* ── STAT ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {/* Streak */}
          <Card padding="md">
            <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
              Streak
            </p>
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {streak}
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              {streak === 0 ? "start today" : streak === 1 ? "day" : "days"}
            </p>
          </Card>

          {/* Calories */}
          <Card padding="md">
            <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
              Calories
            </p>
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {totalCalories}
            </div>
            <p style={{ fontSize: "11px", color: calorieTarget - totalCalories < 0 ? "var(--status-error)" : "var(--text-muted)", marginTop: "4px" }}>
              of {calorieTarget} target
            </p>
            <div style={{ marginTop: "8px", height: "3px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${calPct}%`, height: "100%", backgroundColor: totalCalories > calorieTarget ? "var(--status-error)" : "var(--white)", transition: "width 0.6s ease" }} />
            </div>
          </Card>
        </div>

        {/* ── CATEGORY BREAKDOWN ── */}
        {categorySummaries.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "10px" }}>
              By Category
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {categorySummaries.map(({ category, total, completed }) => {
                const pct = Math.round((completed / total) * 100);
                return (
                  <div
                    key={category.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      backgroundColor: "var(--bg-surface)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* Color accent — thin left bar */}
                    <div style={{ width: "3px", height: "32px", backgroundColor: category.color, borderRadius: "2px", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "13px", fontWeight: 500 }}>{category.name}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {completed}/{total}
                    </span>
                    {/* Mini progress */}
                    <div style={{ width: "40px", height: "3px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--white)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <Link
          href="/log"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            backgroundColor: "var(--white)",
            color: "var(--black)",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
            letterSpacing: "0.01em",
          }}
        >
          <span>{completedCount === totalHabits && totalHabits > 0 ? "Review Today" : "Log Today"}</span>
          <ArrowRight size={18} weight="bold" />
        </Link>
      </div>
    </>
  );
}
