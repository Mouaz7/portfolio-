"use client";

import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import Header from "@/components/header";
import NexbotRobot from "@/components/home/NexbotRobot";
import WordBubble from "@/components/home/WordBubble";
import HelloBadge from "@/components/home/HelloBadge";
import BgBlur from "@/components/home/BgBlur";
import TypeText from "@/components/home/TypeText";
import RoleCycler from "@/components/home/RoleCycler";

import { useViewport } from "@/src/hooks/useViewport";
import { useElementRect } from "@/src/hooks/useElementRect";
import { useSlideScale } from "@/src/hooks/useSlideScale";
import { usePortraitHeight } from "@/src/hooks/usePortraitHeight";
import { useMounted } from "@/src/hooks/useMounted";

const MIN_SLIDE_H = 560;
const MIN_W = 320;
const MIN_H = 380;
const TEXT_OVERLAP = 100;

const HomePage: NextPage = () => {
  // Sequence flags (just orchestration)
  const [goHello, setGoHello] = useState(false);
  const [goIm, setGoIm] = useState(false);
  const [goAdam, setGoAdam] = useState(false);
  const [goSoftwareType, setGoSoftwareType] = useState(false);
  const [goRoles, setGoRoles] = useState(false);
  const [showPortrait, setShowPortrait] = useState(false);
  const [showSoftwareVector, setShowSoftwareVector] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  // Kick off the hello badge shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setGoHello(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Roles are just for visual effect now, no need to trigger anything
  const onRolesDone = () => {
    // Portrait, cards, and CV button are now triggered after "Software" types
  };

  // Layout helpers (unchanged)
  const mounted = useMounted();
  const seRef = useRef<HTMLSpanElement>(null);
  const artBoxRef = useRef<HTMLDivElement>(null);

  const { vh } = useViewport();
  const { slideScale, style: computedSlideStyle } = useSlideScale(vh, MIN_SLIDE_H);
  const seRect = useElementRect(seRef);

  const artHeight = usePortraitHeight({
    vh,
    seBottom: seRect?.bottom ?? null,
    textOverlap: TEXT_OVERLAP,
    slideScale,
    minH: MIN_H,
  });

  const slideStyle = mounted ? computedSlideStyle : { height: "100dvh" };

  return (
    <div className={`relative w-full h-dvh min-w-[${MIN_W}px] overflow-hidden bg-black text-white`}>
      {/* Hidden Link to prefetch contact page */}
      <Link href="/contact-page" prefetch={true} className="hidden" aria-hidden="true" tabIndex={-1} />
      
      <div style={slideStyle}>
        <Header />

        <main className="relative">
          {/* Your gradient/particles background (enters on its own) */}
          {showGlow && (
            <BgBlur
              position="fixed"
              height={`${artHeight}px`}
              cropPct={0}
              topFade="30%"
              enterDelayMs={0}
              enterDurationMs={800}
            />
          )}

          {/* HERO TEXT */}
          <section className="relative z-10 font-urbanist">
            <div
              className="relative mx-auto w-full max-w-[913px] px-5 text-center flex flex-col items-center"
              style={{ paddingTop: "clamp(48px, 10vh, 180px)" }}
            >
              {/* 1) Hello → triggers typing */}
              <HelloBadge
                className="mx-auto -mb-[6px]"
                vectorScale={0.78}
                offsetTopPx={24}
                offsetRightPx={26}
                show={goHello}
                onDone={() => setGoIm(true)}
              />

              {/* 2) "I'm " + "Mouaz" (typed inside WordBubble) + "Software " */}
              <h1 className="mt-4 leading-[1] tracking-[-0.01em] font-semibold text-[clamp(2rem,7vw,96px)] whitespace-nowrap">
                <TypeText
                  text={"I’m "}
                  start={goIm}
                  speedMs={42}
                  onDone={() => setGoAdam(true)}
                  className="inline"
                />

                <WordBubble
                  text="Mouaz"
                  svgSrc="/home/Vector-22.svg"
                  padRatio={0.18}
                  yNudge={-8}
                  className="text-cornflowerblue-100"
                  typeIn
                  startTyping={goAdam}
                  typeSpeedMs={70}
                  onTypedDone={() => setGoSoftwareType(true)}
                />

                <br />

              {/* inside the title where Software types */}
              <span ref={seRef} className="relative inline-block leading-[1] whitespace-nowrap">
                {/* wrap TypeText in a relatively positioned span so the vector can anchor */}
                <span className="relative inline-block">
                  <TypeText
                    text={"Software "}
                    start={goSoftwareType}
                    speedMs={48}
                    onDone={() => {
                      setShowSoftwareVector(true);   // show the swoosh
                      setGoRoles(true);              // then fade the roles
                      setShowPortrait(true);         // show portrait immediately
                      // let the portrait animation breathe, then bring in the glow
                      setTimeout(() => setShowGlow(true), 520 + 600);
                    }}
                    className="inline"
                  />

                  {/* the vector pinned to 'Software' baseline */}
                  <span
                    aria-hidden
                    className={[
                      "absolute pointer-events-none origin-bottom-left",
                      showSoftwareVector ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95",
                      "transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
                    ].join(" ")}
                    style={{
                      width: "1.1em",
                      height: "1.1em",
                      left: 0,
                      bottom: 0,
                      transform: "translate(-0.83em, 0.70em)",
                    }}
                  >
                    <Image src="/home/Vector-2.svg" alt="" fill className="object-contain" />
                  </span>
                </span>
                
                {' '}

                {goRoles && (
                  <RoleCycler
                    start={goRoles}
                    words={["Designer", "Developer", "Engineer"]}
                    initialDelayMs={180}
                    firstDwellMs={500}
                    dwellMs={500}
                    transitionMs={300}
                    effect="fade"
                    onDone={onRolesDone}     // ← use this instead of the inline callback
                    className="inline font-semibold"
                  />
                )}
              </span>

              </h1>
            </div>
          </section>

          {/* 4) Portrait mounts AFTER RoleCycler finishes, so its own entrance plays */}
          <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center">
            <div
              ref={artBoxRef}
              className="relative w-screen max-w-[1100px]"
              style={{ height: `min(82vh, ${Math.max(artHeight, 560)}px)` }}
            >
              {showPortrait && (
                <NexbotRobot className="h-full w-full" />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
