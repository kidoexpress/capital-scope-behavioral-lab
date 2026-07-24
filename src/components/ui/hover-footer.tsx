// hover-footer.tsx — adapted for Vite/React (no Next.js, framer-motion instead of motion/react)
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Code2, X, Mail } from "lucide-react";

/* ─── Text Hover Effect ─────────────────────────────────────── */
interface TextHoverEffectProps {
  text: string;
  duration?: number;
}

export function TextHoverEffect({ text, duration = 0 }: TextHoverEffectProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cxPercent = (x / rect.width) * 100;
      const cyPercent = (y / rect.height) * 100;
      setCursor({ x, y: y - 5 });
      setMaskPosition({ cx: `${cxPercent}%`, cy: `${cyPercent}%` });
    }
  };

  // Unique ID per instance to avoid SVG mask collisions
  const gradId = `textGrad-${text.replace(/\s/g, "")}`;
  const maskId = `textMask-${text.replace(/\s/g, "")}`;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 600 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      style={{ cursor: "default", userSelect: "none" }}
    >
      <defs>
        {/* Static gradient for the base outline */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7c6cf0" stopOpacity={0} />
          <stop offset="25%"  stopColor="#7c6cf0" stopOpacity={1} />
          <stop offset="50%"  stopColor="#a78bfa" stopOpacity={1} />
          <stop offset="75%"  stopColor="#7c6cf0" stopOpacity={1} />
          <stop offset="100%" stopColor="#7c6cf0" stopOpacity={0} />
        </linearGradient>

        {/* Hover radial gradient mask */}
        <radialGradient
          id={maskId}
          cx={maskPosition.cx}
          cy={maskPosition.cy}
          r="30%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"  stopColor="white" stopOpacity={1} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </radialGradient>

        <mask id={`${maskId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${maskId})`} />
        </mask>
      </defs>

      {/* Layer 1 — dim outline (always visible) */}
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "clamp(52px, 10vw, 80px)",
          fontWeight: 800,
          fill: "none",
          stroke: "rgba(255,255,255,0.1)",
        }}
      >
        {text}
      </text>

      {/* Layer 2 — animated stroke gradient */}
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        strokeDasharray="8 4"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "clamp(52px, 10vw, 80px)",
          fontWeight: 800,
          fill: "none",
          stroke: `url(#${gradId})`,
        }}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="100"
          dur="6s"
          repeatCount="indefinite"
        />
        {text}
      </text>

      {/* Layer 3 — hover reveal fill */}
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "clamp(52px, 10vw, 80px)",
          fontWeight: 800,
          fill: `url(#${gradId})`,
          opacity: hovered ? 1 : 0,
          transition: `opacity ${duration || 0.3}s ease`,
        }}
        mask={`url(#${maskId}-mask)`}
      >
        {text}
      </text>

      {/* cursor glow */}
      {hovered && (
        <circle
          cx={cursor.x}
          cy={cursor.y}
          r="24"
          fill="rgba(167,139,250,0.10)"
          style={{ pointerEvents: "none" }}
        />
      )}
    </svg>
  );
}

/* ─── Footer Background Gradient ────────────────────────────── */
export function FooterBackgroundGradient() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      {/* top-left purple */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "-10%",
          width: "50%",
          height: "80%",
          background: "radial-gradient(ellipse, rgba(124,108,240,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* bottom-right violet */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "0%",
          width: "45%",
          height: "70%",
          background: "radial-gradient(ellipse, rgba(167,139,250,0.14) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
    </div>
  );
}

/* ─── Capital Scope Behavioral Lab Footer ─────────────────────── */
/* NOTE: the exported symbol name `CapitalScopeFooter` is kept intentionally
   to avoid churning imports; only the displayed brand text was updated. */
const CORE_TOOLS = [
  { label: "Stock Analyzer", to: "/analyzer" },
  { label: "Portfolio Builder", to: "/portfolio" },
  { label: "Risk Dashboard", to: "/risk" },
  { label: "Monte Carlo Lab", to: "/montecarlo" },
  { label: "Scenario Simulator", to: "/scenarios" },
  { label: "Watchlist", to: "/watchlist" },
];

const AI_AGENTS = [
  { label: "Earnings Reviewer", to: "/agents/earnings" },
  { label: "Market Research AI", to: "/agents/research" },
  { label: "Model Builder", to: "/agents/model" },
  { label: "Deep Dive Research", to: "/research" },
  { label: "Gold Scanner", to: "/scanner" },
  { label: "Terminal", to: "/terminal" },
];

const RESOURCES = [
  { label: "GitHub", href: "https://github.com/kidoexpress/CapitalScope-Terminal" },
  { label: "Documentation", href: "#" },
  { label: "Disclaimer", href: "#" },
];

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.38)",
  textDecoration: "none",
  transition: "color 0.15s ease",
  lineHeight: "1.9",
  display: "block",
};

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={linkStyle}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; }}
    >
      {label}
    </Link>
  );
}

function FooterExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; }}
    >
      {label}
    </a>
  );
}

export function CapitalScopeFooter() {
  return (
    <footer
      style={{
        position: "relative",
        margin: "40px 32px 32px",
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.055)",
        background: "rgba(255,255,255,0.018)",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1136,
          margin: "0 auto",
          padding: "44px 40px 28px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 40,
          }}
          className="footer-grid"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #7c6cf0, #a78bfa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>CS</span>
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #fff 40%, rgba(255,255,255,0.55))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Capital Scope Behavioral Lab
              </span>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.65,
                maxWidth: 260,
                marginBottom: 28,
              }}
            >
              Professional-grade investment research tools for the self-directed investor.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              {[
                { icon: Code2, href: "https://github.com/kidoexpress/CapitalScope-Terminal" },
                { icon: X, href: "https://x.com" },
                { icon: Mail, href: "mailto:contact@capitalscope.io" },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.35)",
                    transition: "all 0.15s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "rgba(255,255,255,0.9)";
                    el.style.borderColor = "rgba(124,108,240,0.5)";
                    el.style.background = "rgba(124,108,240,0.12)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "rgba(255,255,255,0.35)";
                    el.style.borderColor = "rgba(255,255,255,0.08)";
                    el.style.background = "transparent";
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.22)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Core Tools
            </p>
            {CORE_TOOLS.map(item => (
              <FooterLink key={item.to} {...item} />
            ))}
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.22)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              AI Agents
            </p>
            {AI_AGENTS.map(item => (
              <FooterLink key={item.to} {...item} />
            ))}
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.22)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Resources
            </p>
            {RESOURCES.map(item => (
              <FooterExternalLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.05)",
            margin: "40px 0 20px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.16)" }}>
            © {new Date().getFullYear()} Capital Scope Behavioral Lab. Research simulation for educational purposes only. Not financial advice.
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>
            Local research platform
          </p>
        </div>
      </div>
    </footer>
  );
}
