import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
  style?: CSSProperties;
};

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    backgroundColor: "var(--white)",
    color: "var(--black)",
    border: "1px solid var(--white)",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    backgroundColor: "transparent",
    color: "var(--status-error)",
    border: "1px solid var(--status-error)",
  },
};

const hoverStyles: Record<Variant, CSSProperties> = {
  primary: { backgroundColor: "var(--gray-200)", borderColor: "var(--gray-200)" },
  secondary: { backgroundColor: "var(--bg-elevated)", borderColor: "var(--white)" },
  ghost: { backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" },
  danger: { backgroundColor: "rgba(248,113,113,0.08)" },
};

export function Button({
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const base = variantStyles[variant];
  const hover = hoverStyles[variant];

  return (
    <button
      disabled={disabled || isLoading}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          Object.assign(e.currentTarget.style, hover);
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, base);
        onMouseLeave?.(e);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        height: "44px",
        padding: "0 20px",
        borderRadius: "var(--radius-md)",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "var(--font)",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all var(--t-fast)",
        width: fullWidth ? "100%" : undefined,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        ...base,
        ...style,
      }}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            width: "14px",
            height: "14px",
            border: `2px solid currentColor`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </button>
  );
}

// Inject spin keyframe if needed
if (typeof document !== "undefined") {
  const styleId = "__btn-spin";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(s);
  }
}
