import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  TrendingUp, BarChart2, FlaskConical, Zap, FileText, ScanSearch, Activity,
  Briefcase, ShieldCheck, Star, BookOpen, TerminalSquare, Calculator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { CapitalScopeFooter } from "@/components/ui/hover-footer";
import { DATA_SOURCE_LABEL, getQuote, type MarketQuote } from "@/services/marketDataService";

/* ─── Shared container ───────────────────────────────────────── */
const CONTAINER: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 32px",
};

/* ─── Animated rotating word (from animated-hero pattern) ─────── */
function RotatingWord() {
  const words = useMemo(
    () => ["a research desk.", "a hedge fund.", "an institution.", "a quant.", "Wall Street."],
    []
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setIndex(i => (i + 1) % words.length);
    }, 2400);
    return () => clearTimeout(t);
  }, [index, words]);

  return (
    /*
     * The span is display:block so it occupies its own line inside the h1.
     * height:1.1em (relative to the h1 font-size) reserves exactly one line of
     * space so the h1 never reflows when words change.
     * overflow:hidden clips the sliding words so they don't bleed outside.
     */
    <span
      style={{
        display: "block",
        position: "relative",
        overflow: "hidden",
        height: "1.1em",
        marginTop: "0.04em",
      }}
    >
      {/* invisible placeholder — keeps the container height */}
      &nbsp;
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            textAlign: "center",
            color: "rgba(255,255,255,0.42)",
          }}
          initial={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 55, damping: 17 }}
          animate={
            index === i
              ? { y: 0, opacity: 1 }
              : { y: index > i ? -80 : 80, opacity: 0 }
          }
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Feature data ───────────────────────────────────────────── */
interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  path: string;
  accent: string;
  tag: string;
}

const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: "Earnings Reviewer",
    desc: "Dissect earnings calls with AI. Extract beats, misses, guidance changes, and sentiment shifts in seconds.",
    path: "/agents/earnings",
    accent: "#22c55e",
    tag: "AI Agent",
  },
  {
    icon: BarChart2,
    title: "Market Research Agent",
    desc: "Deep competitor analysis, sector tailwinds, macro exposure scoring — delivered as a structured research brief.",
    path: "/agents/research",
    accent: "#3b82f6",
    tag: "AI Agent",
  },
  {
    icon: Activity,
    title: "Model Builder",
    desc: "DCF, LBO, and comps models with AI-guided assumptions and instant sensitivity analysis.",
    path: "/agents/model",
    accent: "#8b5cf6",
    tag: "AI Agent",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Risk Engine",
    desc: "Correlation matrices, concentration risk, sector overlap, and drawdown analytics — all in one view.",
    path: "/risk",
    accent: "#f59e0b",
    tag: "Quantitative",
  },
  {
    icon: FlaskConical,
    title: "Monte Carlo Lab",
    desc: "1,000-path GBM simulation with probability distributions, VaR, and percentile outcomes.",
    path: "/montecarlo",
    accent: "#06b6d4",
    tag: "Simulation",
  },
  {
    icon: ScanSearch,
    title: "Gold Mining Analyzer",
    desc: "Filter junior miners by AISC, grade, reserves, and production profile. Find asymmetric opportunities.",
    path: "/scanner",
    accent: "#f59e0b",
    tag: "Screener",
  },
];

/* ─── Research preview card ──────────────────────────────────── */
function ResearchPreview() {
  const [tab, setTab] = useState<"thesis" | "peers" | "scenarios">("thesis");
  const [quote, setQuote] = useState<MarketQuote | null>(null);

  useEffect(() => {
    void getQuote('NVDA').then(setQuote);
  }, []);

  return (
    <div
      style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 32px 72px rgba(0,0,0,0.55)",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 18px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 10, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.22)" }}>
          capital-scope-behavioral-lab — deep dive research
        </span>
      </div>

      <div style={{ padding: "20px 22px 22px" }}>
        {/* Ticker row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>NVDA</span>
              <span style={{
                padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                background: "rgba(34,197,94,0.1)", color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.2)",
              }}>
                STRONG BUY
              </span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              NVIDIA · Semiconductors · NASDAQ · {DATA_SOURCE_LABEL}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {quote ? `$${quote.price.toFixed(2)}` : "—"}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: (quote?.changePercent ?? 0) >= 0 ? "#22c55e" : "#f43f5e" }}>
              {quote ? `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%` : "Yahoo unavailable"}
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>AI Confidence</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>87%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
              initial={{ width: 0 }}
              whileInView={{ width: "87%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
            />
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 2, padding: 4,
          background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 16,
        }}>
          {(["thesis", "peers", "scenarios"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 7,
                fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: tab === t ? "rgba(255,255,255,0.09)" : "transparent",
                color: tab === t ? "#fff" : "rgba(255,255,255,0.32)",
                textTransform: "capitalize", transition: "all 0.18s",
              }}
            >
              {t === "thesis" ? "Thesis" : t === "peers" ? "Peers" : "Scenarios"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === "thesis" && (
            <motion.div
              key="thesis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {[
                { label: "Core thesis", text: "NVIDIA's data center dominance and CUDA moat create a durable AI infrastructure monopoly. Blackwell ramp tracking ahead of consensus." },
                { label: "Key risk", text: "Customer concentration (Microsoft, Google, Meta ~40% DC rev). Export restrictions could limit China TAM by ~$10B." },
                { label: "Catalysts", text: "Q2 FY26 earnings Jul 2025. GTC keynote. AMD MI350 competitive response." },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 5 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.6)" }}>{item.text}</p>
                </div>
              ))}
            </motion.div>
          )}

          {tab === "peers" && (
            <motion.div
              key="peers"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ overflowX: "auto" }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Ticker", "P/E", "EV/EBITDA", "Rev Growth", "Score"].map(h => (
                      <th key={h} style={{ textAlign: h === "Ticker" ? "left" : "right", paddingBottom: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ticker: "NVDA", pe: "42x", eveb: "35x", growth: "+122%", score: 94, hi: true },
                    { ticker: "AMD",  pe: "28x", eveb: "22x", growth: "+18%",  score: 71, hi: false },
                    { ticker: "INTC", pe: "N/M", eveb: "12x", growth: "-5%",   score: 38, hi: false },
                    { ticker: "QCOM", pe: "18x", eveb: "14x", growth: "+12%",  score: 62, hi: false },
                  ].map(r => (
                    <tr key={r.ticker} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: r.hi ? "rgba(124,108,240,0.06)" : "transparent" }}>
                      <td style={{ padding: "9px 0", fontWeight: 700, color: r.hi ? "#a78bfa" : "rgba(255,255,255,0.65)" }}>{r.ticker}</td>
                      <td style={{ textAlign: "right", color: "rgba(255,255,255,0.5)" }}>{r.pe}</td>
                      <td style={{ textAlign: "right", color: "rgba(255,255,255,0.5)" }}>{r.eveb}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: r.growth.startsWith("+") ? "#22c55e" : "#f43f5e" }}>{r.growth}</td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                          background: r.score > 80 ? "rgba(34,197,94,0.12)" : r.score > 60 ? "rgba(245,158,11,0.12)" : "rgba(244,63,94,0.12)",
                          color: r.score > 80 ? "#22c55e" : r.score > 60 ? "#f59e0b" : "#f43f5e",
                        }}>{r.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {tab === "scenarios" && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {[
                { label: "Bull", prob: "35%", target: "$1,200", ret: "+37%", color: "#22c55e" },
                { label: "Base", prob: "45%", target: "$950",   ret: "+9%",  color: "#a78bfa" },
                { label: "Bear", prob: "20%", target: "$580",   ret: "-34%", color: "#f43f5e" },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.label} Case</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>Prob: {s.prob}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.target}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.ret}</p>
                  </div>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", borderRadius: 10, marginTop: 2,
                background: "rgba(124,108,240,0.06)",
                border: "1px solid rgba(124,108,240,0.14)",
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Probability-weighted EV</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>$929</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Landing dock — every icon links to a real tool ────────── */
function LandingDock() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(prev => {
        if (y < 40) return true;
        if (y > 80) return false;
        return prev;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = [
    { label: "Analyzer",      onClick: () => navigate("/analyzer")        },
    { label: "Portfolio",     onClick: () => navigate("/portfolio")       },
    { label: "Risk",          onClick: () => navigate("/risk")            },
    { label: "Research",      onClick: () => navigate("/agents/research") },
    { label: "Models",        onClick: () => navigate("/agents/model")    },
    { label: "Terminal",      onClick: () => navigate("/terminal")        },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, x: "-50%" }}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -14,
        x: "-50%",
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        zIndex: 50,
        width: "max-content",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <nav
        aria-label="Primary"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: "7px",
          borderRadius: 999,
          background: "rgba(8,10,14,0.74)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.32)",
        }}
      >
        {items.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            style={{
              height: 36,
              minWidth: 92,
              padding: "0 16px",
              border: "none",
              borderRadius: 999,
              background: "transparent",
              color: "rgba(255,255,255,0.62)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 150ms ease, color 150ms ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.92)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.62)";
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </motion.div>
  );
}

/* ─── Landing page ───────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const goLaunch = () => navigate("/analyzer");

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        overflowX: "hidden",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <LandingDock />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          /* Fill most of the viewport but cap so it isn't absurdly tall */
          minHeight: "min(100vh, 860px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Dot matrix + overlays */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>

          {/* Breathing pulse wrapper — the whole dot field inhales & exhales */}
          <motion.div
            style={{ position: "absolute", inset: 0 }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
          >
            <CanvasRevealEffect
              colors={[[134, 239, 172]]}   /* light green — tailwind green-300 */
              animationSpeed={3}
              dotSize={5}
              showGradient={false}
              opacities={[0.3, 0.3, 0.4, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1]}
            />
          </motion.div>

          {/* Radial vignette — dark centre for legibility, lets edges glow */}
          <div
            style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse 72% 72% at 50% 50%, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.68) 55%, rgba(0,0,0,0.1) 100%)",
            }}
          />

          {/* Bottom fade into the stats strip */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 220,
              background: "linear-gradient(to top, #000 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Hero content — properly constrained */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 900,
            margin: "0 auto",
            /* top padding clears the fixed navbar (52px + 20px top + 28px gap) */
            padding: "100px 32px 72px",
            textAlign: "center",
          }}
        >
          {/* Headline with rotating word */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.55 }}
            style={{
              fontSize: "clamp(44px, 7vw, 84px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#fff",
              margin: "0 auto 24px",
              maxWidth: 850,
            }}
          >
            Research investments
            <RotatingWord />
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.5 }}
            style={{
              maxWidth: 560,
              margin: "0 auto 36px",
              fontSize: 18,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.44)",
              fontWeight: 400,
            }}
          >
            A focused investment research workspace for stock analysis, portfolio risk,
            market scenarios, earnings review, and valuation work.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.45 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <button
              onClick={goLaunch}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "15px 30px",
                background: "#fff", color: "#000",
                border: "none", borderRadius: 100,
                fontSize: 14, fontWeight: 700,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "0 14px 36px rgba(255,255,255,0.18)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              Open Terminal <ArrowRight size={15} />
            </button>

            <button
              onClick={() => document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "15px 30px",
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 100,
                fontSize: 14, fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.12)";
                el.style.color = "#fff";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.07)";
                el.style.color = "rgba(255,255,255,0.75)";
              }}
            >
              View Research Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "52px 0",
        }}
      >
        <div style={CONTAINER}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {[
              { value: "1,000+", label: "Monte Carlo paths" },
              { value: "50+",    label: "Risk metrics tracked" },
              { value: "Real-time", label: "Market data feeds" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.48 }}
                style={{ textAlign: "center" }}
              >
                <p
                  style={{
                    fontSize: 36, fontWeight: 800,
                    letterSpacing: "-0.03em", color: "#fff", marginBottom: 4,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.32)" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────── */}
      <section id="features" style={{ padding: "112px 0" }}>
        <div style={CONTAINER}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <p
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                marginBottom: 14,
              }}
            >
              Full Suite
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 3.8vw, 44px)", fontWeight: 800,
                letterSpacing: "-0.03em", lineHeight: 1.1,
              }}
            >
              Everything you need to research
              <br />
              <span style={{ color: "rgba(255,255,255,0.32)" }}>like a professional.</span>
            </h2>
          </motion.div>

          {/*
           * 3 columns on desktop ≥1024px
           * 2 columns on tablet  ≥640px
           * 1 column  on mobile
           */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ delay: i * 0.055, duration: 0.45 }}
                  onClick={() => navigate(f.path)}
                  style={{
                    padding: 28,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                    transition: "transform 0.22s, background 0.22s, border-color 0.22s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-4px)";
                    el.style.background = "rgba(255,255,255,0.04)";
                    el.style.borderColor = `${f.accent}28`;
                    const arrow = el.querySelector<HTMLElement>("[data-arrow]");
                    if (arrow) arrow.style.opacity = "1";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(0)";
                    el.style.background = "rgba(255,255,255,0.025)";
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    const arrow = el.querySelector<HTMLElement>("[data-arrow]");
                    if (arrow) arrow.style.opacity = "0";
                  }}
                >
                  {/* Tag chip */}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: `${f.accent}14`, color: f.accent,
                      marginBottom: 16,
                    }}
                  >
                    {f.tag}
                  </span>

                  {/* Icon */}
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${f.accent}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Icon size={20} style={{ color: f.accent }} />
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </p>

                  {/* Hover arrow — fades in on hover via JS */}
                  <div
                    data-arrow
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      marginTop: 20, fontSize: 12, fontWeight: 600,
                      color: f.accent, opacity: 0,
                      transition: "opacity 0.18s",
                    }}
                  >
                    Open module <ArrowRight size={12} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RESEARCH PREVIEW ─────────────────────────────── */}
      <section
        id="preview"
        style={{
          padding: "112px 0",
          background: "rgba(255,255,255,0.014)",
          borderTop: "1px solid rgba(255,255,255,0.045)",
          borderBottom: "1px solid rgba(255,255,255,0.045)",
        }}
      >
        <div style={CONTAINER}>
          {/*
           * 2 columns: 0.9fr | 1.1fr on large screens
           * Stacks to 1 column on mobile
           */}
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <p
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                  marginBottom: 16,
                }}
              >
                Live Preview
              </p>
              <h2
                style={{
                  fontSize: "clamp(24px, 3.2vw, 38px)", fontWeight: 800,
                  letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16,
                }}
              >
                Research that reads
                <br />
                <span style={{ color: "rgba(255,255,255,0.34)" }}>like a research desk's.</span>
              </h2>
              <p
                style={{
                  fontSize: 15, lineHeight: 1.7,
                  color: "rgba(255,255,255,0.4)", maxWidth: 400, marginBottom: 28,
                }}
              >
                AI-generated thesis, peer valuation tables, scenario analysis —
                all from a single ticker input. In seconds, not hours.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                {[
                  "Structured thesis with AI confidence scoring",
                  "Peer comparison across 4+ valuation multiples",
                  "Bull / Base / Bear scenario with probability weights",
                  "Key catalysts and risks auto-extracted",
                ].map(pt => (
                  <div key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div
                      style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.22)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginTop: 2,
                      }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>{pt}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/research")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 22px",
                  background: "rgba(255,255,255,0.07)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 100,
                  fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.18s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              >
                Try Deep Dive Research <ArrowRight size={13} />
              </button>
            </motion.div>

            {/* Right — preview card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <ResearchPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ padding: "136px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 55% 65% at 50% 100%, rgba(124,108,240,0.07) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "0 32px" }}
        >
          <p
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.18)",
              marginBottom: 20,
            }}
          >
            Get started free
          </p>
          <h2
            style={{
              fontSize: "clamp(30px, 5vw, 54px)", fontWeight: 800,
              letterSpacing: "-0.04em", lineHeight: 1.06, marginBottom: 18,
            }}
          >
            This is what serious fintech
            <br />research looks like.
          </h2>
          <p
            style={{
              fontSize: 16, color: "rgba(255,255,255,0.34)",
              lineHeight: 1.65, marginBottom: 36,
            }}
          >
            No Bloomberg subscription required. Just AI-powered tools built for the
            way professionals actually research.
          </p>
          <button
            onClick={goLaunch}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 32px",
              background: "#fff", color: "#000",
              border: "none", borderRadius: 100,
              fontSize: 16, fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 20px 48px rgba(255,255,255,0.16)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "none";
            }}
          >
            Launch Terminal — it's free <ArrowRight size={16} />
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <CapitalScopeFooter />
    </div>
  );
}
