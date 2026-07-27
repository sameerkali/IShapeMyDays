import type { CSSProperties, InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  style?: CSSProperties;
};

export function Input({ label, error, helperText, style, onFocus, onBlur, id, ...rest }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: error ? "var(--status-error)" : "var(--text-secondary)",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--white)";
          e.currentTarget.style.backgroundColor = "#262626";
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--border-strong)";
          e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
          onBlur?.(e);
        }}
        style={{
          height: "46px",
          padding: "0 14px",
          backgroundColor: "var(--bg-elevated)",
          border: `1.5px solid ${error ? "var(--status-error)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
          fontSize: "14px",
          fontFamily: "var(--font)",
          outline: "none",
          width: "100%",
          transition: "border-color var(--t-fast), background var(--t-fast)",
          ...style,
        }}
        {...rest}
      />
      {error ? (
        <span style={{ fontSize: "11px", color: "var(--status-error)", marginTop: "2px", fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

