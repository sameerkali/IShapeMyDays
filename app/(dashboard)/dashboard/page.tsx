import { TopBar } from "@/components/layout/TopBar";

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" />
      <div style={{ padding: "var(--space-4)" }}>
        <h2>Welcome to IShapeMyDays</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
          Your daily productivity dashboard will appear here.
        </p>
      </div>
    </>
  );
}
