"use client";

import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import Header from "@/components/layout/Header";
import SocialLinks from "@/components/layout/SocialLinks";
import RoleCycler from "@/components/home/RoleCycler";
import ScrollHint from "@/components/home/ScrollHint";
import CursorGlow from "@/components/home/CursorGlow";
import FloatingStats from "@/components/home/FloatingStats";
import TechMarquee from "@/components/home/TechMarquee";
import MagneticButton from "@/components/home/MagneticButton";

/** Small staged fade/rise used to choreograph the hero entrance. */
function Reveal({
  show,
  delay = 0,
  className = "",
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "transition-all duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform",
        show ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-[6px]",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${show ? delay : 0}ms` }}
    >
      {children}
    </div>
  );
}

const ArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="transition-transform duration-300 ease-out group-hover:translate-x-1"
  >
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="transition-transform duration-300 ease-out group-hover:translate-y-0.5"
  >
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HomePage: NextPage = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 70);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative h-dvh w-full min-w-[320px] overflow-hidden text-white">
      {/* Prefetch the contact route (kept from before) */}
      <Link href="/contact" prefetch={true} className="hidden" aria-hidden="true" tabIndex={-1} />

      {/* Accent spotlight trailing the cursor (constellation backdrop is global) */}
      <CursorGlow />

      <div className="relative z-10 flex h-full flex-col">
        <Header />

        <main className="relative flex flex-1 items-center justify-center px-6 sm:px-10">
          {/* Theme-aware scrim so the type reads cleanly over the field */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[78vmin] w-[88vmin] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(var(--bg-rgb),0.6), rgba(var(--bg-rgb),0) 76%)",
            }}
          />

          {/* Floating, DB-driven stat cards in the side gutters (xl+ only) */}
          <FloatingStats show={show} />

          <div className="relative flex w-full max-w-[940px] flex-col items-center text-center font-urbanist">
            {/* Availability chip */}
            <Reveal show={show} delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-[rgba(var(--bg-rgb),0.4)] px-3.5 py-1.5 text-[clamp(0.76rem,1.2vw,0.92rem)] font-medium text-gray-100 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Karlskrona, Sweden · Open to opportunities
              </span>
            </Reveal>

            {/* Greeting */}
            <Reveal show={show} delay={90} className="mt-[clamp(18px,3.4vh,30px)]">
              <p className="text-[clamp(1rem,2vw,1.35rem)] font-medium tracking-[0.02em] text-gray-100">
                Hi, I&apos;m
              </p>
            </Reveal>

            {/* Name — kinetic accent gradient */}
            <Reveal show={show} delay={170}>
              <h1 className="hero-name mt-1 font-extrabold leading-[0.98] tracking-[-0.02em] text-[clamp(2.6rem,8.6vw,6.6rem)]">
                Mouaz Naji
              </h1>
            </Reveal>

            {/* Role line — loops forever */}
            <Reveal show={show} delay={250}>
              <p className="mt-[clamp(8px,1.6vh,16px)] text-[clamp(1.1rem,3.2vw,2rem)] font-semibold leading-tight">
                Software{" "}
                <RoleCycler
                  start={show}
                  loop
                  words={["Engineer", "Developer", "Designer"]}
                  initialDelayMs={400}
                  firstDwellMs={1600}
                  dwellMs={1600}
                  transitionMs={360}
                  effect="fadeSlide"
                  className="inline text-accent"
                />
              </p>
            </Reveal>

            {/* Tagline */}
            <Reveal show={show} delay={340} className="mt-[clamp(14px,2.6vh,24px)]">
              <p className="mx-auto max-w-[52ch] text-[clamp(0.95rem,1.6vw,1.18rem)] leading-relaxed text-gray-100">
                I craft fast, accessible web &amp; systems software — turning ideas into
                clean interfaces backed by reliable, well-tested code.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal
              show={show}
              delay={430}
              className="mt-[clamp(22px,3.6vh,34px)] flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              <MagneticButton href="/projects" variant="primary">
                View Projects
                <ArrowIcon />
              </MagneticButton>
              <MagneticButton href="/api/cv" variant="ghost" download>
                Download CV
                <DownloadIcon />
              </MagneticButton>
            </Reveal>

            {/* Social links */}
            <Reveal show={show} delay={520} className="mt-[clamp(20px,3vh,30px)]">
              <SocialLinks />
            </Reveal>
          </div>
        </main>
      </div>

      {/* Live tech-stack marquee (pulled from /api/skills) */}
      <TechMarquee show={show} />

      {/* Hint that wheel / swipe navigates onward */}
      <ScrollHint show={show} />

      <style jsx>{`
        .hero-name {
          background-image: linear-gradient(
            100deg,
            var(--fg) 0%,
            var(--accent) 48%,
            var(--fg) 100%
          );
          background-size: 220% 100%;
          background-position: 0% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: heroSheen 7s ease-in-out infinite;
        }
        @keyframes heroSheen {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-name {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
