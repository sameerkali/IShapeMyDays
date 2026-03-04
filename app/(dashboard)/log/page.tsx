import { TopBar } from "@/components/layout/TopBar";

export default function LogPage() {
  return (
    <>
      <TopBar title="Daily Log" />
      <div style={{ padding: "var(--space-4)" }}>
        <p style={{ color: "var(--text-muted)" }}>
          Log your habits and calories here.
        </p>
      </div>
    </>
  );
}
