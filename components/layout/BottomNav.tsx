"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  House,
  CheckCircle,
  ChartLineUp,
  UserCircle,
} from "@phosphor-icons/react";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/log", label: "Log", icon: CheckCircle },
  { href: "/analytics", label: "Analytics", icon: ChartLineUp },
  { href: "/profile", label: "Profile", icon: UserCircle },
] as const;

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        height: "64px",
        backgroundColor: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-default)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Main navigation"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname?.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-1)",
              flex: 1,
              height: "100%",
              textDecoration: "none",
              color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
              transition: "color var(--transition-fast)",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={24}
              weight={isActive ? "bold" : "regular"}
              color={isActive ? "var(--accent-primary)" : "var(--text-muted)"}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 600 : 400,
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export { BottomNav };
