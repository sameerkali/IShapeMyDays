import type { CSSProperties, ReactNode, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  style?: CSSProperties;
  onClick?: (e?: any) => void;
  className?: string;
}

const paddingMap = {
  none: "0",
  sm: "12px",
  md: "16px",
  lg: "20px",
};

export function Card({ children, padding = "md", hoverable, style, onClick, className, ...props }: CardProps) {
  const isInteractive = Boolean(onClick || hoverable);

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: paddingMap[padding],
        cursor: isInteractive ? "pointer" : undefined,
        transition: isInteractive ? "background var(--t-fast), border-color var(--t-fast)" : undefined,
        ...style,
      }}
      onMouseEnter={isInteractive ? (e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      } : undefined}
      onMouseLeave={isInteractive ? (e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-surface)";
        e.currentTarget.style.borderColor = "var(--border)";
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

