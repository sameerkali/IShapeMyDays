import { type HTMLAttributes, forwardRef } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
};

const paddingMap = {
  sm: "var(--space-3)",
  md: "var(--space-4)",
  lg: "var(--space-6)",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, padding = "md", children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-card=""
        className={className}
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          padding: paddingMap[padding],
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
          transition: hoverable ? "all var(--transition-normal)" : undefined,
          cursor: hoverable ? "pointer" : undefined,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (hoverable) {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-elevated)";
          }
        }}
        onMouseLeave={(e) => {
          if (hoverable) {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-default)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export { Card, type CardProps };
