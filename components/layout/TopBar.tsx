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
        height: "52px",
        padding: "0 16px",
        backgroundColor: "var(--bg-base)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </span>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}

export { TopBar };
