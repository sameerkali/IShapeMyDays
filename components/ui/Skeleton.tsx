"use client";

import React from "react";

type SkeletonProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
};

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-sm)",
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--bg-tertiary)",
        animation: "shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

type SkeletonCardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function SkeletonCard({ children, style }: SkeletonCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        border: "1px solid var(--border-default)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
