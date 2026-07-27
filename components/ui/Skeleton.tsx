import type { CSSProperties } from "react";

type SkeletonProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: CSSProperties;
};

export function Skeleton({ width = "100%", height = "14px", borderRadius = "var(--radius-sm)", style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--bg-elevated)",
        animation: "shimmer 1.5s ease infinite",
        ...style,
      }}
    />
  );
}

type SkeletonCardProps = {
  children?: React.ReactNode;
  style?: CSSProperties;
};

export function SkeletonCard({ children, style }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        ...style,
      }}
    >
      {children || (
        <>
          <Skeleton width="40%" height="12px" />
          <Skeleton width="70%" height="16px" />
          <Skeleton width="55%" height="12px" />
        </>
      )}
    </div>
  );
}
