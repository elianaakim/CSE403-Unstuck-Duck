"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const SLIDES = [
  {
    id: "duck",
    label: "DUCK",
    labelLo: "Duck",
    href: "/duck",
    src: "/duck_l.png",
    alt: "Duck",
    line1: "TEACH",
    line2: "YOUR",
    line3: "DUCK.",
    sub: " Explain concepts / Get questioned back / Earn a score",
    index: "01",
    color: "#f97316",
  },
  {
    id: "lake",
    label: "LAKE",
    labelLo: "Lake",
    href: "/lake",
    src: "/lake.png",
    alt: "Lake",
    line1: "DIVE",
    line2: "DEEP",
    line3: "IN.",
    sub: " Open-ended / Explore freely / No limits",
    index: "02",
    color: "#38d9a9",
  },
  {
    id: "history",
    label: "HISTORY",
    labelLo: "History",
    href: "/history",
    src: "/hist.png",
    alt: "History",
    line1: "YOUR",
    line2: "JOURNEY",
    line3: "HERE.",
    sub: " Past sessions / Progress tracked / Patterns revealed",
    index: "03",
    color: "#a78bfa",
  },
];

export default function Home() {
  const [sel, setSel] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ticker, setTicker] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);

  // Scrolling ticker
  useEffect(() => {
    tickerRef.current = setInterval(() => setTicker((t) => t + 1), 40);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      if (busy || next === sel) return;
      setBusy(true);
      setTimeout(() => {
        setSel(next);
        setAnimKey((k) => k + 1);
        setBusy(false);
      }, 200);
    },
    [busy, sel]
  );

  const goNext = () => go((sel + 1) % SLIDES.length);
  const goPrev = () => go((sel - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel, busy]);

  const cur = SLIDES[sel];

  const tickerText = "UNSTUCK DUCK — TEACH TO LEARN — LEARN BY TEACHING — ";
  const offset = (ticker * 0.6) % (tickerText.length * 12);

  return (
    <>
      <style>{`
        @keyframes h-fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes h-fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes h-slideTitle {
          from { opacity:0; transform:translateX(-24px) skewX(-2deg); }
          to   { opacity:1; transform:translateX(0) skewX(0deg); }
        }
        @keyframes h-imgIn {
          from { opacity:0; transform:scale(0.88) rotate(-3deg); }
          to   { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes h-bob {
          0%,100% { transform:translateY(0) rotate(-2deg); }
          50%     { transform:translateY(-16px) rotate(3deg); }
        }
        @keyframes h-scanline {
          from { top: -4px; }
          to   { top: 100%; }
        }
        @keyframes h-blink {
          0%,49% { opacity:1; }
          50%,100%{ opacity:0; }
        }

        .h-s1 { animation: h-fadeUp 0.5s 0.0s cubic-bezier(0.22,1,0.36,1) both; }
        .h-s2 { animation: h-fadeUp 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both; }
        .h-s3 { animation: h-fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
        .h-s4 { animation: h-fadeUp 0.5s 0.24s cubic-bezier(0.22,1,0.36,1) both; }

        .h-title { animation: h-slideTitle 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .h-img   { animation: h-imgIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .h-bob   { animation: h-bob 2.6s ease-in-out infinite; }
        .h-cursor { animation: h-blink 1s step-end infinite; }

        /* Scanline effect on image card */
        .h-scanline::after {
          content:'';
          position:absolute;
          left:0; right:0;
          height:2px;
          background:rgba(249,115,22,0.15);
          animation:h-scanline 3s linear infinite;
          pointer-events:none;
        }

        /* Nav pills */
        .h-pill {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 5px 12px;
          border: 1px solid var(--border2);
          border-radius: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .h-pill:hover, .h-pill.active {
          background: var(--acid);
          color: var(--black);
          border-color: var(--acid);
        }

        /* Big ghost nav button */
        .h-ghost-btn {
          font-family: var(--font-display);
          font-size: 13px;
          letter-spacing: 0.15em;
          padding: 12px 28px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .h-ghost-btn:hover {
          border-color: var(--white);
          color: var(--white);
        }
        .h-ghost-btn:active { transform: scale(0.97); }

        .h-cta {
          font-family: var(--font-display);
          font-size: 15px;
          letter-spacing: 0.15em;
          padding: 14px 40px;
          background: var(--acid);
          color: var(--black);
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .h-cta:hover {
          background: #d9ff3d;
          transform: translate(-2px,-2px);
          box-shadow: 4px 4px 0 rgba(249,115,22,0.4);
        }
        .h-cta:active { transform: translate(0,0); box-shadow: none; }

        /* Slash nav item */
        .h-slash-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 6px 0;
          border-bottom: 1px solid var(--border);
          transition: all 0.15s;
          opacity: 0.5;
        }
        .h-slash-item:hover, .h-slash-item.active { opacity: 1; }
        .h-slash-item.active .h-slash { color: var(--acid); }
      `}</style>

      <div
        className="z1 min-h-screen flex flex-col"
        style={{
          fontFamily: "var(--font-body)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.3s ease",
          paddingTop: 56,
        }}
      >
        {/* ── SCROLLING TICKER TAPE ── */}
        <div
          className="h-s1 overflow-hidden border-b"
          style={{
            borderColor: "var(--border)",
            height: 32,
            background: "var(--off)",
          }}
        >
          <div
            className="flex items-center h-full whitespace-nowrap"
            style={{
              transform: `translateX(-${offset}px)`,
              willChange: "transform",
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: i % 2 === 0 ? "var(--muted)" : "var(--acid)",
                  paddingRight: 48,
                  textTransform: "uppercase",
                }}
              >
                {tickerText}
              </span>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div
          className="flex flex-1"
          style={{ minHeight: 0, paddingLeft: "60px" }}
        >
          {/* LEFT COLUMN — slide selector */}
          <div
            className="h-s2 flex-shrink-0 flex flex-col justify-between border-r py-8 px-5"
            style={{
              width: 200,
              borderColor: "var(--border)",
              display: "none",
            }}
          />

          {/* CENTER — hero content */}
          <div className="flex-1 flex flex-col justify-between pl-16 pr-8 md:pl-24 md:pr-14 py-10 min-w-0">
            {/* Hero: two-column */}
            <div className="flex-1 flex items-center gap-10 lg:gap-16">
              {/* Big title block */}
              <div className="flex-1 min-w-0">
                <div
                  key={`title-${animKey}`}
                  className="h-title"
                  style={{ lineHeight: 0.9 }}
                >
                  {/* Slash category */}
                  <div
                    className="mb-4"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: cur.color,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    / {cur.labelLo}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(72px, 11vw, 130px)",
                      color: "var(--white)",
                      letterSpacing: "0.01em",
                      lineHeight: 0.92,
                    }}
                  >
                    <div>{cur.line1}</div>
                    <div>{cur.line2}</div>
                    <div style={{ color: cur.color }}>{cur.line3}</div>
                  </div>
                </div>

                {/* Sub-tagline */}
                <div
                  key={`sub-${animKey}`}
                  className="h-s3 mt-6 mb-8"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--muted)",
                    letterSpacing: "0.05em",
                    lineHeight: 2,
                  }}
                >
                  {cur.sub
                    .split(" / ")
                    .filter(Boolean)
                    .map((item, i) => (
                      <div key={i}>
                        <span style={{ color: cur.color }}>/ </span>
                        {item}
                      </div>
                    ))}
                </div>

                {/* CTA row */}
                <div
                  key={`cta-${animKey}`}
                  className="h-s4 flex items-center gap-4 flex-wrap"
                >
                  <Link
                    href={cur.href}
                    className="h-cta"
                    style={{ background: cur.color }}
                  >
                    Enter {cur.labelLo} →
                  </Link>

                  <button className="h-ghost-btn" onClick={goPrev}>
                    ← PREV
                  </button>
                  <button className="h-ghost-btn" onClick={goNext}>
                    NEXT →
                  </button>
                </div>
              </div>

              {/* Image card */}
              <div
                key={`card-${animKey}`}
                className="h-img h-scanline flex-shrink-0 relative hidden md:flex items-center justify-center overflow-hidden"
                style={{
                  width: 360,
                  height: 400,
                  background: "var(--card)",
                  border: `1px solid ${cur.color}22`,
                  boxShadow: `0 0 0 1px var(--card2), 8px 8px 0 ${cur.color}18`,
                  position: "relative",
                }}
              >
                {/* Mode label */}
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 12,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: cur.color,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    zIndex: 2,
                  }}
                >
                  MODE_{cur.index}
                </span>

                {/* Accent corner bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 3,
                    height: "100%",
                    background: cur.color,
                  }}
                />

                <div className="h-bob relative z-10">
                  <Image
                    src={cur.src}
                    alt={cur.alt}
                    width={290}
                    height={290}
                    className="object-contain"
                    style={{ filter: `drop-shadow(0 8px 32px ${cur.color}40)` }}
                    draggable="false"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Bottom row: dot nav + keyboard hint */}
            <div
              className="h-s4 flex items-center justify-between mt-8 pt-6"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="flex gap-3 items-center">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => go(i)}
                    style={{
                      width: i === sel ? 32 : 8,
                      height: 3,
                      background: i === sel ? cur.color : "var(--lo)",
                      border: "none",
                      cursor: "pointer",
                      transition:
                        "width 0.35s cubic-bezier(0.22,1,0.36,1), background 0.25s",
                      borderRadius: 0,
                    }}
                    aria-label={s.label}
                  />
                ))}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--lo)",
                    letterSpacing: "0.1em",
                    marginLeft: 8,
                  }}
                >
                  ← → TO NAVIGATE
                </span>
              </div>

              <div className="hidden md:flex gap-6">
                {SLIDES.filter((_, i) => i !== sel).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => go(SLIDES.findIndex((x) => x.id === s.id))}
                    className="flex items-center gap-2 h-slash-item"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--white)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: s.color, letterSpacing: 0 }}>/</span>
                    {s.labelLo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — decorative index strip */}
          <div
            className="hidden lg:flex flex-col justify-between border-l py-10 px-4 flex-shrink-0"
            style={{
              width: 64,
              borderColor: "var(--border)",
              writingMode: "vertical-rl",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--lo)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                transform: "rotate(180deg)",
              }}
            >
              unstuck-duck.app
            </span>
            <div
              style={{
                width: 1,
                flex: 1,
                maxHeight: 80,
                margin: "16px auto",
                background: `linear-gradient(to bottom, transparent, ${cur.color})`,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: cur.color,
                letterSpacing: "0.2em",
                transform: "rotate(180deg)",
                transition: "color 0.3s",
              }}
            >
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* ── BOTTOM FOOTER BAR ── */}
        <div
          className="flex items-center justify-between px-8 md:px-14"
          style={{
            height: 40,
            borderTop: "1px solid var(--border)",
            background: "var(--off)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--lo)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            learn by teaching — unstuck duck
          </span>
        </div>
      </div>
    </>
  );
}
