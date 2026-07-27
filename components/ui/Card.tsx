import type { CSSProperties, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
};

const paddingMap = {
  none: "0",
  sm: "12px",
  md: "16px",
  lg: "20px",
};

export function Card({ children, padding = "md", style, onClick, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: paddingMap[padding],
        cursor: onClick ? "pointer" : undefined,
        transition: onClick ? "background var(--t-fast), border-color var(--t-fast)" : undefined,
        ...style,
      }}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-surface)";
        e.currentTarget.style.borderColor = "var(--border)";
      } : undefined}
    >
      {children}
    </div>
  );
}
