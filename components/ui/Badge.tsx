import type { CSSProperties, ReactNode, HTMLAttributes } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "neutral" | "accent";

const variantMap: Record<BadgeVariant, CSSProperties> = {
  default: {
    backgroundColor: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-strong)",
  },
  success: {
    backgroundColor: "rgba(74,222,128,0.08)",
    color: "var(--status-success)",
    border: "1px solid rgba(74,222,128,0.2)",
  },
  warning: {
    backgroundColor: "rgba(250,204,21,0.08)",
    color: "var(--status-warning)",
    border: "1px solid rgba(250,204,21,0.2)",
  },
  error: {
    backgroundColor: "rgba(248,113,113,0.08)",
    color: "var(--status-error)",
    border: "1px solid rgba(248,113,113,0.2)",
  },
  neutral: {
    backgroundColor: "transparent",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
  },
  accent: {
    backgroundColor: "rgba(99,102,241,0.12)",
    color: "var(--accent, #6366f1)",
    border: "1px solid rgba(99,102,241,0.3)",
  },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: CSSProperties;
}

export function Badge({ children, variant = "default", style, ...props }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "20px",
        padding: "0 6px",
        borderRadius: "var(--radius-xs)",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...variantMap[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

