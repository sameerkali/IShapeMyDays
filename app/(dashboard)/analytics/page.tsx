import { TopBar } from "@/components/layout/TopBar";

export default function AnalyticsPage() {
  return (
    <>
      <TopBar title="Analytics" />
      <div style={{ padding: "var(--space-4)" }}>
        <p style={{ color: "var(--text-muted)" }}>
          Charts and insights will appear here.
        </p>
      </div>
    </>
  );
}
