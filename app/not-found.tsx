"use client";

import Link from "next/link";
import { WarningCircle, House } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-base, #0a0a0a)",
        color: "var(--text-primary, #f5f5f5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-inter), sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          backgroundColor: "var(--bg-surface, #111111)",
          border: "1px solid var(--border-strong, #383838)",
          borderRadius: "var(--radius-lg, 8px)",
          padding: "36px 24px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-md, 6px)",
            backgroundColor: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            color: "var(--status-error, #f87171)",
          }}
        >
          <WarningCircle size={36} weight="bold" />
        </div>

        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted, #666666)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          404 — Page Not Found
        </span>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text-primary, #f5f5f5)",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          This Page Doesn't Exist
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary, #a8a8a8)",
            lineHeight: "1.6",
            marginBottom: "28px",
          }}
        >
          The page you are looking for might have been removed, renamed, or is temporarily unavailable.
        </p>

        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <Button variant="primary" fullWidth style={{ gap: "8px" }}>
            <House size={18} weight="bold" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
