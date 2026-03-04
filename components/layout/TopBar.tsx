"use client";

type TopBarProps = {
  title: string;
  rightAction?: React.ReactNode;
};

function TopBar({ title, rightAction }: TopBarProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        padding: "0 var(--space-4)",
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-default)",
        backdropFilter: "blur(8px)",
      }}
    >
      <h1 style={{ fontSize: "18px", fontWeight: 600 }}>{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}

export { TopBar };
