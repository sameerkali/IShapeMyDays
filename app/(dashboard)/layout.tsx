import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        maxWidth: "640px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <main
        style={{
          flex: 1,
          paddingBottom: "80px", /* Space for bottom nav */
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
