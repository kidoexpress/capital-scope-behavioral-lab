// Adapted from animated-hero reference — Vite/React, no Next.js deps
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface AnimatedHeroProps {
  /** Static prefix before the rotating word */
  prefix?: string;
  /** Words to cycle through */
  titles?: string[];
  /** Milliseconds between word transitions */
  interval?: number;
  onCta?: () => void;
  ctaLabel?: string;
}

export function AnimatedHero({
  prefix = "Research investments like",
  titles = ["a research desk.", "a hedge fund.", "an institution.", "a quant.", "Wall Street."],
  interval = 2400,
  onCta,
  ctaLabel = "Get started",
}: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const memoTitles = useMemo(() => titles, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setTitleNumber(n => (n === memoTitles.length - 1 ? 0 : n + 1));
    }, interval);
    return () => clearTimeout(t);
  }, [titleNumber, memoTitles, interval]);

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      {/* Rotating headline */}
      <h1
        style={{
          fontSize: "clamp(44px, 7vw, 84px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "#fff",
          margin: 0,
        }}
      >
        <span style={{ display: "block" }}>{prefix}</span>

        {/* Rotating container — reserves one line-height of space */}
        <span
          style={{
            position: "relative",
            display: "block",
            overflow: "hidden",
            height: "1.1em",
            marginTop: "0.04em",
          }}
        >
          {/* Invisible placeholder keeps the height */}
          &nbsp;
          {memoTitles.map((title, i) => (
            <motion.span
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                textAlign: "center",
                color: "rgba(255,255,255,0.42)",
                fontWeight: 800,
              }}
              initial={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 55, damping: 17 }}
              animate={
                titleNumber === i
                  ? { y: 0, opacity: 1 }
                  : { y: titleNumber > i ? -80 : 80, opacity: 0 }
              }
            >
              {title}
            </motion.span>
          ))}
        </span>
      </h1>

      {/* CTA */}
      {onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: 32,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 28px",
            background: "#fff",
            color: "#000",
            border: "none",
            borderRadius: 100,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {ctaLabel} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
