"use client";

import { type InputHTMLAttributes, forwardRef, useState } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: error ? "var(--status-error)" : "var(--text-muted)",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={{
            height: "44px",
            padding: "0 var(--space-4)",
            backgroundColor: "var(--bg-primary)",
            border: `1px solid ${
              error
                ? "var(--status-error)"
                : isFocused
                ? "var(--border-focus)"
                : "var(--border-default)"
            }`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color var(--transition-fast)",
            width: "100%",
            ...style,
          }}
          {...props}
        />
        {(error || helperText) && (
          <span
            style={{
              fontSize: "12px",
              color: error ? "var(--status-error)" : "var(--text-muted)",
            }}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input, type InputProps };
