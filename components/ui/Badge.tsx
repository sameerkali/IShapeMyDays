type BadgeVariant = "success" | "warning" | "error" | "neutral" | "accent";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: React.ReactNode;
};

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "rgba(34, 197, 94, 0.15)", text: "var(--status-success)" },
  warning: { bg: "rgba(245, 158, 11, 0.15)", text: "var(--status-warning)" },
  error: { bg: "rgba(239, 68, 68, 0.15)", text: "var(--status-error)" },
  neutral: { bg: "rgba(148, 163, 184, 0.15)", text: "var(--status-neutral)" },
  accent: { bg: "rgba(16, 185, 129, 0.15)", text: "var(--accent-primary)" },
};

function Badge({ variant = "neutral", children, style, ...props }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        backgroundColor: colors.bg,
        color: colors.text,
        lineHeight: 1.6,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
