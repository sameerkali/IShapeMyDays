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
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/log",       label: "Log",  icon: CheckCircle },
  { href: "/analytics", label: "Stats",icon: ChartLineUp },
  { href: "/profile",   label: "Me",   icon: UserCircle },
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
        alignItems: "stretch",
        height: "60px",
        backgroundColor: "var(--bg-base)",
        borderTop: "1px solid var(--border)",
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
              gap: "3px",
              flex: 1,
              textDecoration: "none",
              color: isActive ? "var(--white)" : "var(--text-muted)",
              borderRight: "1px solid var(--border)",
              transition: "color var(--t-fast), background var(--t-fast)",
              backgroundColor: isActive ? "var(--bg-surface)" : "transparent",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={20}
              weight={isActive ? "fill" : "regular"}
            />
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
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
