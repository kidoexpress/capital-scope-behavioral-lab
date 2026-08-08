"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * NOTE ON SPACING: this project's `src/index.css` declares `* { margin:0; padding:0 }`
 * outside any cascade layer, which beats Tailwind v4's layered utilities. Tailwind
 * spacing classes (px-*, mb-*, gap-*) therefore do nothing here, so all spacing in
 * this component is set with inline styles.
 */

interface FinanceImpactCardProps {
  title?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryValue?: number;
  secondaryValue?: number;
  primaryDelta?: string;
  secondaryDelta?: string;
  totalLabel?: string;
  currency?: string;
  enableAnimations?: boolean;
  onMoreDetails?: () => void;
}

const RISK = "#7da7ff";
const OFFSET = "#55d99a";
const MONO = "JetBrains Mono, monospace";

const defaultProps: Partial<FinanceImpactCardProps> = {
  title: "Portfolio Exposure",
  primaryLabel: "Risk Capital",
  secondaryLabel: "Hedge Offset",
  primaryValue: 0,
  secondaryValue: 0,
  primaryDelta: "0.00%",
  secondaryDelta: "No explicit hedge",
  totalLabel: "NET IMPACT",
  currency: "$",
  enableAnimations: true,
};

function formatMoney(value: number, currency: string) {
  const abs = Math.abs(value);
  const formatted = abs >= 1_000_000
    ? `${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
      ? `${(abs / 1_000).toFixed(1)}k`
      : Math.round(abs).toLocaleString("en-US");
  return `${value < 0 ? "-" : ""}${currency}${formatted}`;
}

const eyebrow: CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.40)",
};
const truncate: CSSProperties = {
  minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

export function FinanceImpactCard(props: FinanceImpactCardProps) {
  const {
    title, primaryLabel, secondaryLabel, primaryValue, secondaryValue,
    primaryDelta, secondaryDelta, totalLabel, currency, enableAnimations, onMoreDetails,
  } = { ...defaultProps, ...props };

  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const risk = Math.abs(primaryValue!);
  const offset = Math.abs(secondaryValue!);
  const gross = risk + offset;
  const netValue = primaryValue! + secondaryValue!;
  const hasExposure = gross > 0;

  // The ring encodes the real split between shock and hedge, so the legend colours
  // below describe the data instead of being decoration.
  const riskPct = hasExposure ? (risk / gross) * 100 : 0;
  const offsetPct = hasExposure ? (offset / gross) * 100 : 0;
  // Share of the shock actually neutralised by hedges — the number that matters.
  const coverage = risk > 0 ? Math.min(offset / risk, 1) : 0;

  const GAP = 1.6; // separation between arcs, in pathLength units
  const arc = (pct: number) => Math.max(0, pct - GAP);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.06, delayChildren: 0.08 },
    },
  };

  const legend = [
    { label: primaryLabel!, value: primaryValue!, delta: primaryDelta!, color: RISK, pct: riskPct },
    { label: secondaryLabel!, value: secondaryValue!, delta: secondaryDelta!, color: OFFSET, pct: offsetPct },
  ];

  return (
    <motion.div
      style={{ width: "100%" }}
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      variants={shouldAnimate ? containerVariants : undefined}
    >
      <div
        style={{
          position: "relative", overflow: "hidden", borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.03)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
          height: "100%",
        }}
      >
        <div style={{ position: "relative", padding: "22px 20px 20px" }}>
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: 28, pointerEvents: "none",
              background:
                "radial-gradient(circle at 50% 8%, rgba(138,164,255,0.10), transparent 42%)," +
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          />

          {/* header */}
          <div style={{
            position: "relative", zIndex: 1, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, marginBottom: 20,
          }}>
            <span style={{ ...eyebrow, ...truncate }}>{title}</span>
            <span style={{
              flexShrink: 0, borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.45)",
            }}>
              Scenario
            </span>
          </div>

          {/* gauge — fluid, so it scales with the column instead of overflowing */}
          <div style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 232,
            margin: "0 auto", aspectRatio: "1 / 1",
          }}>
            <svg viewBox="0 0 200 200" aria-hidden="true"
              style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              {hasExposure && (
                <>
                  <motion.circle
                    cx="100" cy="100" r="86" fill="none" pathLength={100}
                    stroke={RISK} strokeWidth="10" strokeLinecap="round"
                    initial={shouldAnimate ? { strokeDasharray: "0 100" } : { strokeDasharray: `${arc(riskPct)} 100` }}
                    animate={{ strokeDasharray: `${arc(riskPct)} 100` }}
                    transition={{ delay: 0.15, duration: 0.85, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                  <motion.circle
                    cx="100" cy="100" r="86" fill="none" pathLength={100}
                    stroke={OFFSET} strokeWidth="10" strokeLinecap="round"
                    strokeDashoffset={-riskPct}
                    initial={shouldAnimate ? { strokeDasharray: "0 100" } : { strokeDasharray: `${arc(offsetPct)} 100` }}
                    animate={{ strokeDasharray: `${arc(offsetPct)} 100` }}
                    transition={{ delay: 0.35, duration: 0.85, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                </>
              )}
            </svg>

            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", padding: "0 26px", textAlign: "center",
            }}>
              {hasExposure ? (
                <>
                  <motion.span
                    style={{ ...eyebrow, fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)" }}
                    initial={shouldAnimate ? { opacity: 0, y: -6 } : undefined}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                    transition={{ delay: 0.3 }}
                  >
                    {totalLabel}
                  </motion.span>
                  <motion.span
                    style={{
                      marginTop: 6, fontFamily: MONO, fontSize: 32, fontWeight: 700,
                      lineHeight: 1, letterSpacing: "-0.04em",
                      color: netValue >= 0 ? "#a7f3d0" : "#fecdd3",
                    }}
                    initial={shouldAnimate ? { opacity: 0, y: 10, filter: "blur(4px)" } : undefined}
                    animate={shouldAnimate ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                    transition={{ delay: 0.42, type: "spring", stiffness: 300, damping: 28 }}
                  >
                    {formatMoney(netValue, currency!)}
                  </motion.span>
                  {risk > 0 && (
                    <motion.span
                      style={{ marginTop: 8, fontSize: 11, lineHeight: 1.3, color: "rgba(255,255,255,0.40)" }}
                      initial={shouldAnimate ? { opacity: 0 } : undefined}
                      animate={shouldAnimate ? { opacity: 1 } : undefined}
                      transition={{ delay: 0.6 }}
                    >
                      {(coverage * 100).toFixed(0)}% of the shock offset
                    </motion.span>
                  )}
                </>
              ) : (
                /* honest empty state — a giant $0 inside a ring reads as a broken value */
                <>
                  <span style={{ ...eyebrow, fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)" }}>
                    {totalLabel}
                  </span>
                  <span style={{
                    marginTop: 6, fontFamily: MONO, fontSize: 28, fontWeight: 700,
                    lineHeight: 1, color: "rgba(255,255,255,0.30)",
                  }}>
                    —
                  </span>
                  <span style={{ marginTop: 10, fontSize: 11, lineHeight: 1.4, color: "rgba(255,255,255,0.35)" }}>
                    No exposure modelled yet
                  </span>
                </>
              )}
            </div>
          </div>

          {/* legend + values */}
          <div style={{ position: "relative", zIndex: 1, marginTop: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {legend.map((item, i) => (
                <motion.div
                  key={item.label}
                  style={{
                    minWidth: 0, borderRadius: 16, padding: "10px 12px",
                    border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)",
                  }}
                  initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 2, height: 12, flexShrink: 0, borderRadius: 999, background: item.color }} />
                    <span style={{ ...truncate, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)" }}>
                      {item.label}
                    </span>
                    {hasExposure && (
                      <span style={{
                        marginLeft: "auto", flexShrink: 0, fontFamily: MONO,
                        fontSize: 10, color: "rgba(255,255,255,0.30)",
                      }}>
                        {item.pct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div style={{
                    marginTop: 7, fontFamily: MONO, fontSize: 18, fontWeight: 700,
                    lineHeight: 1, color: "#fff",
                  }}>
                    {formatMoney(item.value, currency!)}
                  </div>
                  <div style={{ ...truncate, marginTop: 7, fontSize: 11, fontWeight: 600, color: item.color }}
                    title={item.delta}>
                    {item.delta}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              type="button"
              style={{
                width: "100%", borderRadius: 16, padding: "12px 16px", cursor: "pointer",
                fontSize: 13.5, fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)",
                color: "rgba(255,255,255,0.75)", transition: "background-color 160ms ease",
              }}
              initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.7 }}
              whileHover={shouldAnimate ? { scale: 1.012 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.985 } : undefined}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.035)"; }}
              onClick={onMoreDetails}
            >
              View Exposure Details
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function BonusesIncentivesCard(props: FinanceImpactCardProps) {
  return <FinanceImpactCard {...props} />;
}
