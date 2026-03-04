import { TopBar } from "@/components/layout/TopBar";

export default function ProfilePage() {
  return (
    <>
      <TopBar title="Profile" />
      <div style={{ padding: "var(--space-4)" }}>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile information will appear here.
        </p>
      </div>
    </>
  );
}
