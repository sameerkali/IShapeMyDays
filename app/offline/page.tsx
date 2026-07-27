"use client";

import Link from "next/link";
import { WifiSlash, ArrowClockwise, House } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
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
            backgroundColor: "rgba(250, 204, 21, 0.1)",
            border: "1px solid rgba(250, 204, 21, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            color: "var(--status-warning, #facc15)",
          }}
        >
          <WifiSlash size={36} weight="bold" />
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
          PWA Offline Mode
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
          You are Offline
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary, #a8a8a8)",
            lineHeight: "1.6",
            marginBottom: "28px",
          }}
        >
          No internet connection detected. Please check your network connection and retry once reconnected.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => window.location.reload()}
            style={{ gap: "8px" }}
          >
            <ArrowClockwise size={18} weight="bold" />
            Retry Connection
          </Button>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Button variant="secondary" fullWidth style={{ gap: "8px" }}>
              <House size={18} weight="bold" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
