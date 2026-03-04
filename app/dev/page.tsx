"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  House,
  CheckCircle,
  ChartLineUp,
  Fire,
  Trash,
  PencilSimple,
  PlusCircle,
} from "@phosphor-icons/react";

export default function DevShowcasePage() {
  return (
    <div
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-8)",
      }}
    >
      <div>
        <h1>IShapeMyDays — Design System</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
          Component showcase for visual verification.
        </p>
      </div>

      {/* ── Colors ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Color Tokens</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {[
            { label: "Primary BG", color: "var(--bg-primary)" },
            { label: "Secondary BG", color: "var(--bg-secondary)" },
            { label: "Tertiary BG", color: "var(--bg-tertiary)" },
            { label: "Accent", color: "var(--accent-primary)" },
            { label: "Accent Hover", color: "var(--accent-hover)" },
            { label: "Indigo", color: "var(--accent-secondary)" },
            { label: "Success", color: "var(--status-success)" },
            { label: "Warning", color: "var(--status-warning)" },
            { label: "Error", color: "var(--status-error)" },
            { label: "Neutral", color: "var(--status-neutral)" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: color,
                  border: "1px solid var(--border-default)",
                }}
              />
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Typography</h2>
        <Card>
          <h1>H1 — 24px / 700</h1>
          <h2 style={{ marginTop: "var(--space-2)" }}>H2 — 20px / 600</h2>
          <h3 style={{ marginTop: "var(--space-2)" }}>H3 — 18px / 600</h3>
          <p
            style={{
              fontSize: "16px",
              fontWeight: 500,
              marginTop: "var(--space-2)",
            }}
          >
            Body Large — 16px / 500
          </p>
          <p style={{ fontSize: "14px", marginTop: "var(--space-2)" }}>
            Body Regular — 14px / 400
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "var(--space-2)",
            }}
          >
            Caption — 12px / Muted
          </p>
        </Card>
      </section>

      {/* ── Buttons ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Buttons</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <Button variant="primary" fullWidth>
            Primary Action
          </Button>
          <Button variant="secondary" fullWidth>
            Secondary Action
          </Button>
          <Button variant="danger" fullWidth>
            Danger Action
          </Button>
          <Button variant="ghost" fullWidth>
            Ghost Action
          </Button>
          <Button variant="primary" isLoading fullWidth>
            Loading...
          </Button>
          <Button variant="primary" disabled fullWidth>
            Disabled
          </Button>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Inputs</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Input label="Email" placeholder="you@example.com" type="email" />
          <Input
            label="Name"
            placeholder="Enter your name"
            helperText="This will be displayed on your profile."
          />
          <Input
            label="Invalid field"
            placeholder="Something wrong"
            error="This field is required."
          />
        </div>
      </section>

      {/* ── Cards ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Cards</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <Card>
            <h3>Default Card</h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "14px",
                marginTop: "var(--space-1)",
              }}
            >
              Static card with border and shadow.
            </p>
          </Card>
          <Card hoverable>
            <h3>Hoverable Card</h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "14px",
                marginTop: "var(--space-1)",
              }}
            >
              Hover me to see the elevation effect.
            </p>
          </Card>
        </div>
      </section>

      {/* ── Badges ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Badges</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <Badge variant="success">Completed</Badge>
          <Badge variant="warning">In Progress</Badge>
          <Badge variant="error">Failed</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="accent">Active</Badge>
        </div>
      </section>

      {/* ── Progress Ring ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Progress Ring</h2>
        <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <ProgressRing value={1450} max={2000} label="kcal" />
          <ProgressRing value={2200} max={2000} label="kcal" />
          <ProgressRing value={5} max={8} size={80} strokeWidth={8} label="habits" />
        </div>
      </section>

      {/* ── Icons ── */}
      <section>
        <h2 style={{ marginBottom: "var(--space-4)" }}>Phosphor Icons</h2>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {[
            { Icon: House, label: "House" },
            { Icon: CheckCircle, label: "CheckCircle" },
            { Icon: ChartLineUp, label: "ChartLineUp" },
            { Icon: Fire, label: "Fire" },
            { Icon: Trash, label: "Trash" },
            { Icon: PencilSimple, label: "PencilSimple" },
            { Icon: PlusCircle, label: "PlusCircle" },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Icon size={24} color="var(--text-muted)" />
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: "var(--space-8)" }} />
    </div>
  );
}
