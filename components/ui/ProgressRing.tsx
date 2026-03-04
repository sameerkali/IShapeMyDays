import { useEffect, useRef, useState } from "react";

export type ProgressRingProps = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export function ProgressRing({ value, max, size = 120, strokeWidth = 10, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - percentage * circumference;
  const isOver = value > max;

  // unique id used for svg defs and class names
  const uid = `ring-${size}-${label || "x"}`.replace(/\s/g, "");

  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const to = value;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(to * ease));
      if (progress < 1) animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [value]);

  // colors driven by design tokens defined in globals.css
  const glowColor = isOver ? "var(--status-error)" : "var(--accent-secondary)";
  const shimmerAngle = mounted ? percentage * 360 - 90 : -90;
  const shimmerX = size / 2 + radius * Math.cos((shimmerAngle * Math.PI) / 180);
  const shimmerY = size / 2 + radius * Math.sin((shimmerAngle * Math.PI) / 180);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes pulse-ring-${uid} {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes shimmer-dot-${uid} {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes glow-pulse-${uid} {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.65; }
        }
        @keyframes fade-count {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .arc-${uid} {
          transition: stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: pulse-ring-${uid} 3s ease-in-out infinite;
        }
        .dot-${uid} {
          animation: shimmer-dot-${uid} 1.5s ease-in-out infinite;
          transition: cx 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), cy 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .glow-${uid} {
          transition: stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: glow-pulse-${uid} 3s ease-in-out infinite;
        }
        .count-${uid} { animation: fade-count 0.6s 0.2s ease both; }
      `}</style>

      <svg width={size} height={size} style={{ position: "absolute" }} overflow="visible">
        <defs>
          <linearGradient id={`pg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-secondary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
          <linearGradient id={`eg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--status-error)" />
            <stop offset="100%" stopColor="var(--status-error)" />
          </linearGradient>
          <filter id={`gf-${uid}`}>            <feGaussianBlur stdDeviation={strokeWidth * 0.9} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`df-${uid}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer deco ring */}
        <circle cx={size/2} cy={size/2} r={radius + strokeWidth} fill="none" stroke={glowColor} strokeWidth={0.5} opacity={0.15} />

        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />

        {/* Glow layer */}
        <circle
          className={`glow-${uid}`}
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth * 1.8}
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", filter: `blur(${strokeWidth * 1.1}px)` }}
        />

        {/* Main arc */}
        <circle
          className={`arc-${uid}`}
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={isOver ? `url(#eg-${uid})` : `url(#pg-${uid})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />

        {/* Tip dot */}
        {mounted && percentage > 0.02 && (
          <circle
            className={`dot-${uid}`}
            cx={shimmerX} cy={shimmerY}
            r={strokeWidth * 0.65}
            fill={glowColor}
            filter={`url(#df-${uid})`}
          />
        )}
      </svg>

      <div className={`count-${uid}`} style={{ textAlign: "center", zIndex: 1, fontFamily: "'DM Mono', 'Fira Code', monospace" }}>
        <span style={{ fontSize: size > 100 ? "24px" : "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          {displayValue}
        </span>
        {label && (
          <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
