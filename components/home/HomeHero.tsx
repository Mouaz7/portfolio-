"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import Header from "@/components/layout/Header";
import SocialLinks from "@/components/layout/SocialLinks";
import RoleCycler from "@/components/home/RoleCycler";
import ScrollHint from "@/components/home/ScrollHint";
import CursorGlow from "@/components/home/CursorGlow";
import MagneticButton from "@/components/home/MagneticButton";
import type { SiteProfile } from "@/lib/profile";

/** Staged fade / rise / blur used to choreograph the entrance. */
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
        "transition-all duration-[800ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform",
        show ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[7px]",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${show ? delay : 0}ms` }}
    >
      {children}
    </div>
  );
}

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-y-0.5">
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Minimal, premium home intro — identity only (greeting, name, role, tagline,
 * CTAs, socials) over the global constellation. Deliberately does NOT repeat the
 * Skills / Projects / Roadmap pages (no stats, featured project or tech list).
 * All copy is DB-driven via the `profile` prop (site_profile) — nothing here is
 * hardcoded. The cluster floats with a subtle pointer-parallax tilt (pointer
 * only, reduced-motion safe).
 */
export default function HomeHero({ profile }: { profile: SiteProfile }) {
  const [show, setShow] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 70);
    return () => clearTimeout(t);
  }, []);

  // Subtle 3D parallax of the hero cluster following the pointer.
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      el.style.transform = `perspective(1100px) rotateX(${(-cy * 2.4).toFixed(3)}deg) rotateY(${(cx * 2.8).toFixed(3)}deg) translate3d(${(cx * 8).toFixed(2)}px, ${(cy * 6).toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="relative h-dvh w-full min-w-[320px] overflow-hidden text-white">
      <Link href="/contact" prefetch className="hidden" aria-hidden tabIndex={-1} />
      <CursorGlow />

      <div className="relative z-10 flex h-full flex-col">
        <Header />

        <main className="relative grid flex-1 place-items-center px-6 sm:px-10">
          {/* Theme-aware scrim so the type reads cleanly over the field */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[82vmin] w-[92vmin] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(var(--bg-rgb),0.6), rgba(var(--bg-rgb),0) 76%)",
            }}
          />

          <div
            ref={tiltRef}
            className="relative flex w-full max-w-[920px] flex-col items-center text-center font-urbanist [transform-style:preserve-3d] will-change-transform"
          >
            {/* Availability / location chip */}
            <Reveal show={show} delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-[rgba(var(--bg-rgb),0.5)] px-4 py-1.5 text-[clamp(0.76rem,1.2vw,0.92rem)] font-medium text-gray-100 shadow-[0_8px_30px_rgba(var(--accent-rgb),0.08)] backdrop-blur-md">
                {profile.available && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                )}
                {profile.location} · {profile.availability}
              </span>
            </Reveal>

            {/* Greeting */}
            <Reveal show={show} delay={110} className="mt-[clamp(20px,3.8vh,38px)]">
              <p className="text-[clamp(1rem,2vw,1.4rem)] font-medium uppercase tracking-[0.22em] text-gray-100">
                {profile.greeting}
              </p>
            </Reveal>

            {/* Name — kinetic accent gradient with soft glow */}
            <Reveal show={show} delay={200}>
              <h1 className="hero-name mt-2 font-extrabold leading-[0.92] tracking-[-0.03em] text-[clamp(3rem,10vw,8rem)]">
                {profile.name}
              </h1>
            </Reveal>

            {/* Role + accent flourish */}
            <Reveal show={show} delay={300} className="mt-[clamp(10px,1.8vh,20px)] flex flex-col items-center gap-[clamp(10px,1.6vh,18px)]">
              <p className="text-[clamp(1.15rem,3.4vw,2.2rem)] font-semibold leading-tight">
                {profile.rolePrefix}{" "}
                <RoleCycler
                  start={show}
                  loop
                  words={profile.roles}
                  initialDelayMs={420}
                  firstDwellMs={1700}
                  dwellMs={1700}
                  transitionMs={380}
                  effect="fadeSlide"
                  className="inline text-accent"
                />
              </p>
              <span aria-hidden className="h-[3px] w-[clamp(48px,7vw,84px)] rounded-full bg-gradient-to-r from-accent to-accent-strong" />
            </Reveal>

            {/* Tagline */}
            <Reveal show={show} delay={400} className="mt-[clamp(16px,2.8vh,28px)]">
              <p className="mx-auto max-w-[50ch] text-[clamp(0.98rem,1.6vw,1.2rem)] leading-relaxed text-gray-100">
                {profile.tagline}
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal
              show={show}
              delay={500}
              className="mt-[clamp(26px,4vh,40px)] flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              <MagneticButton href="/projects" variant="primary">
                View Projects
                <ArrowIcon />
              </MagneticButton>
              <MagneticButton href={profile.cvUrl} variant="ghost" download>
                Download CV
                <DownloadIcon />
              </MagneticButton>
            </Reveal>

            {/* Social links */}
            <Reveal show={show} delay={590} className="mt-[clamp(22px,3.4vh,34px)]">
              <SocialLinks />
            </Reveal>
          </div>
        </main>
      </div>

      <ScrollHint show={show} />

      <style jsx>{`
        .hero-name {
          background-image: linear-gradient(100deg, var(--fg) 0%, var(--accent) 48%, var(--fg) 100%);
          background-size: 220% 100%;
          background-position: 0% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 16px 48px rgba(var(--accent-rgb), 0.2));
          animation: heroSheen 7s ease-in-out infinite;
        }
        @keyframes heroSheen {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-name { animation: none; }
        }
      `}</style>
    </div>
  );
}
