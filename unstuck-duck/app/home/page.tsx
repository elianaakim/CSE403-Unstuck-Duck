"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SLIDES = [
  {
    id: "duck",
    label: "Duck",
    href: "/duck",
    src: "/duck_l.png",
    alt: "Duck Image",
    tagline: "Chat with your rubber duck tutor",
    accent: "#facc15",
  },
  {
    id: "lake",
    label: "Lake",
    href: "/lake",
    src: "/lake.png",
    alt: "Lake Image",
    tagline: "Dive into open-ended exploration",
    accent: "#38bdf8",
  },
  {
    id: "history",
    label: "History",
    href: "/history",
    src: "/hist.png",
    alt: "History Image",
    tagline: "All your prior learning in one place",
    accent: "#a78bfa",
  },
];

export default function Home() {
  const [selected, setSelected] = useState(0);

  function prev() {
    setSelected((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  }

  function next() {
    setSelected((s) => (s + 1) % SLIDES.length);
  }

  const current = SLIDES[selected];
  const leftSlide = SLIDES[(selected - 1 + SLIDES.length) % SLIDES.length];
  const rightSlide = SLIDES[(selected + 1) % SLIDES.length];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-neutral-950 font-sans overflow-hidden transition-colors duration-300">
      {/* ── Hero text ── */}
      <div className="text-center pt-16 pb-8 px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-neutral-500 mb-3 transition-colors duration-300">
          Where would you like to go?
        </p>
        <h1
          className="text-5xl font-bold tracking-tight leading-tight transition-colors duration-500"
          style={{ color: current.accent }}
        >
          {current.label}
        </h1>
        <p
          className="mt-3 text-base transition-colors duration-500"
          style={{ color: current.accent + "99" }}
        >
          {current.tagline}
        </p>
      </div>

      {/* ── Carousel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Track */}
        <div className="relative flex items-center justify-center w-full max-w-3xl gap-6 mb-10">
          {/* Left ghost card */}
          <button
            onClick={prev}
            className="group relative flex-shrink-0 cursor-pointer bg-transparent border-none p-0"
            aria-label={`Go to ${leftSlide.label}`}
          >
            <div className="w-36 h-36 rounded-2xl bg-stone-200 dark:bg-white/5 border border-stone-300 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-stone-300 dark:group-hover:bg-white/10 group-hover:scale-105">
              <Image
                src={leftSlide.src}
                alt={leftSlide.alt}
                width={100}
                height={100}
                className="object-contain opacity-40 group-hover:opacity-60 transition-opacity duration-300"
                draggable="false"
              />
            </div>
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-neutral-600 group-hover:text-stone-600 dark:group-hover:text-neutral-400 transition-colors">
              {leftSlide.label}
            </p>
          </button>

          {/* Center active card */}
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-20 dark:opacity-30 scale-90 transition-colors duration-500"
              style={{ backgroundColor: current.accent }}
            />
            <div
              className="relative w-64 h-64 rounded-3xl border flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500"
              style={{
                backgroundColor: current.accent + "18",
                borderColor: current.accent + "55",
              }}
            >
              <Image
                src={current.src}
                alt={current.alt}
                width={220}
                height={220}
                className="object-contain drop-shadow-xl transition-all duration-500"
                draggable="false"
              />
            </div>
          </div>

          {/* Right ghost card */}
          <button
            onClick={next}
            className="group relative flex-shrink-0 cursor-pointer bg-transparent border-none p-0"
            aria-label={`Go to ${rightSlide.label}`}
          >
            <div className="w-36 h-36 rounded-2xl bg-stone-200 dark:bg-white/5 border border-stone-300 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-stone-300 dark:group-hover:bg-white/10 group-hover:scale-105">
              <Image
                src={rightSlide.src}
                alt={rightSlide.alt}
                width={100}
                height={100}
                className="object-contain opacity-40 group-hover:opacity-60 transition-opacity duration-300"
                draggable="false"
              />
            </div>
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-neutral-600 group-hover:text-stone-600 dark:group-hover:text-neutral-400 transition-colors">
              {rightSlide.label}
            </p>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2 mb-10">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setSelected(i)}
              className="rounded-full transition-all duration-300 bg-transparent border-none p-0"
              style={{
                width: i === selected ? 28 : 8,
                height: 8,
                backgroundColor:
                  i === selected ? current.accent : "rgba(128,128,128,0.3)",
              }}
              aria-label={`Go to ${slide.label}`}
            />
          ))}
        </div>

        {/* CTA button */}
        <Link
          href={current.href}
          className="flex items-center gap-2 font-semibold text-neutral-950 text-sm px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
          style={{
            backgroundColor: current.accent,
            boxShadow: `0 8px 32px ${current.accent}55`,
          }}
        >
          Go to {current.label}
          <span className="text-base">→</span>
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-stone-200 dark:border-white/10 px-10 py-4 flex items-center justify-between transition-colors duration-300">
        <span className="text-xs text-stone-400 dark:text-neutral-600 transition-colors duration-300">
          © {new Date().getFullYear()} Unstuck Duck
        </span>
        <div className="flex gap-5">
          <Link
            href="#"
            className="text-xs text-stone-400 dark:text-neutral-600 hover:text-stone-700 dark:hover:text-neutral-300 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-xs text-stone-400 dark:text-neutral-600 hover:text-stone-700 dark:hover:text-neutral-300 transition-colors"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
