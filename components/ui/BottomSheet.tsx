"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.75)",
          zIndex: 100,
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Sheet — Fixed horizontal layout centering to eliminate animation jump/fluctuation */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          margin: "0 auto",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90dvh",
          overflowY: "auto",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          zIndex: 101,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          animation: "slideUp 0.18s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            backgroundColor: "var(--bg-surface)",
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "all var(--t-fast)",
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </>
  );
}
