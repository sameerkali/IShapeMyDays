"use client";

import { type ButtonHTMLAttributes, forwardRef, useState } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--accent-primary)",
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-default)",
  },
  danger: {
    backgroundColor: "var(--status-error)",
    color: "#ffffff",
    border: "none",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-muted)",
    border: "none",
  },
};

const variantHoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--accent-hover)" },
  secondary: { borderColor: "var(--border-hover)", backgroundColor: "var(--bg-tertiary)" },
  danger: { backgroundColor: "#DC2626" },
  ghost: { backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", fullWidth = false, isLoading = false, children, disabled, style, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-2)",
      height: "48px",
      padding: "0 var(--space-6)",
      borderRadius: "var(--radius-md)",
      fontSize: "14px",
      fontWeight: 600,
      fontFamily: "inherit",
      cursor: disabled || isLoading ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "all var(--transition-fast)",
      width: fullWidth ? "100%" : "auto",
      transform: isPressed ? "scale(0.97)" : "scale(1)",
      ...variantStyles[variant],
      ...(isHovered && !disabled && !isLoading ? variantHoverStyles[variant] : {}),
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={baseStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => {
          if (!disabled && !isLoading) setIsPressed(true);
        }}
        onMouseUp={() => setIsPressed(false)}
        {...props}
      >
        {isLoading ? (
          <span
            style={{
              width: "18px",
              height: "18px",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button, type ButtonProps, type ButtonVariant };
