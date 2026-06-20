"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import Header from "@/components/layout/Header";
import SocialLinks from "@/components/layout/SocialLinks";
import RoleCycler from "@/components/home/RoleCycler";
import Magnetic from "@/components/home/Magnetic";
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
          {/* Soft legibility scrim so the type reads over the shader */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[88vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(var(--bg-rgb),0.72), rgba(var(--bg-rgb),0.32) 55%, rgba(var(--bg-rgb),0) 80%)",
            }}
          />

          <div
            ref={tiltRef}
            className="relative flex w-full max-w-[920px] flex-col items-center text-center font-urbanist [transform-style:preserve-3d] will-change-transform"
          >
            {/* Name — kinetic gradient, clean rise-in entrance */}
            <Reveal show={show} delay={100}>
              <h1 className="hero-name mt-[clamp(14px,2.6vh,30px)] font-extrabold leading-[0.88] tracking-[-0.045em] text-[clamp(3.2rem,12vw,9.5rem)]">
                {profile.name}
              </h1>
            </Reveal>

            {/* Role */}
            <Reveal show={show} delay={300} className="mt-[clamp(12px,2vh,24px)] flex flex-col items-center gap-[clamp(10px,1.6vh,18px)]">
              <p className="text-[clamp(1.2rem,3.4vw,2.4rem)] font-semibold leading-tight tracking-[-0.01em]">
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
              <span className="hero-underline h-[3px] w-[clamp(64px,10vw,130px)] rounded-full" />
            </Reveal>

            {/* Tagline */}
            <Reveal show={show} delay={400} className="mt-[clamp(18px,3vh,30px)]">
              <p className="mx-auto max-w-[50ch] text-[clamp(0.94rem,1.45vw,1.15rem)] leading-relaxed text-gray-200">
                {profile.tagline}
              </p>
            </Reveal>

            {/* Focus / specialty chips (magnetic) */}
            {profile.focusAreas.length > 0 && (
              <Reveal
                show={show}
                delay={470}
                className="mt-[clamp(18px,2.8vh,28px)] flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
              >
                {profile.focusAreas.map((area) => (
                  <Magnetic key={area} strength={0.35}>
                    <span className="hero-chip inline-flex items-center gap-1.5 rounded-full border border-[var(--surface-border)] bg-[rgba(var(--bg-rgb),0.35)] px-3.5 py-1.5 text-[clamp(0.74rem,1.1vw,0.9rem)] font-medium text-gray-100 backdrop-blur-md transition-colors duration-300 hover:border-accent/60 hover:text-[var(--fg)]">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {area}
                    </span>
                  </Magnetic>
                ))}
              </Reveal>
            )}

            {/* CTAs */}
            <Reveal
              show={show}
              delay={560}
              className="mt-[clamp(26px,4vh,42px)] flex flex-wrap items-center justify-center gap-3 sm:gap-4"
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

            {/* Socials */}
            <Reveal show={show} delay={660} className="mt-[clamp(22px,3.4vh,36px)]">
              <SocialLinks />
            </Reveal>
          </div>
        </main>
      </div>

      <style jsx>{`
        .hero-name {
          background-image: linear-gradient(
            100deg,
            var(--fg) 0%,
            var(--accent) 38%,
            var(--accent-2) 58%,
            var(--fg) 100%
          );
          background-size: 240% 100%;
          background-position: 0% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 18px 56px rgba(var(--accent-rgb), 0.28));
          animation: heroSheen 7s ease-in-out infinite;
        }
        .hero-underline {
          background-image: linear-gradient(90deg, var(--accent), var(--accent-2));
          box-shadow: 0 0 18px rgba(var(--accent-rgb), 0.5);
        }
        .hero-chip:hover { box-shadow: 0 6px 22px rgba(var(--accent-rgb), 0.14); }
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
