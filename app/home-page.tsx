"use client";

import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { BrainIcon } from "@phosphor-icons/react/dist/csr/Brain";
import { CloudArrowUpIcon } from "@phosphor-icons/react/dist/csr/CloudArrowUp";
import { DatabaseIcon } from "@phosphor-icons/react/dist/csr/Database";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { TestTubeIcon } from "@phosphor-icons/react/dist/csr/TestTube";
import {
  FALLBACK_HOME_CONTENT,
  type HomeCapability,
  type HomeContent,
} from "@/lib/home/types";

import Header from "@/components/navigation/Header";
import DownloadCvButton from "@/components/home/download-cv-button";
import HelloBadge from "@/components/home/HelloBadge";
import MainPicPlaceholder from "@/components/home/MainPicPlaceholder";
import RoleCycler from "@/components/home/RoleCycler";
import TypeText from "@/components/home/TypeText";

import styles from "./home-page.module.css";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localizedPath } from "@/lib/i18n/config";

const HOME_CAPABILITY_ICONS: Record<HomeCapability["iconKey"], Icon> = {
  backend: DatabaseIcon,
  ai: BrainIcon,
  "secure-web": ShieldCheckIcon,
  "cloud-devops": CloudArrowUpIcon,
  quality: TestTubeIcon,
};

function HomeCapabilityGrid({ capabilities, label }: { capabilities: HomeCapability[]; label: string }) {
  return (
    <section
      className={styles.capabilityGrid}
      aria-label={label}
      data-home-capabilities
    >
      <div className={styles.capabilityList}>
        {capabilities.map((capability) => {
          const CapabilityIcon = HOME_CAPABILITY_ICONS[capability.iconKey];

          return (
            <article
              className={styles.capabilityCard}
              data-home-capability={capability.id}
              key={capability.id}
            >
              <span className={styles.capabilityIconWrap} aria-hidden="true">
                <CapabilityIcon
                  className={styles.capabilityIcon}
                  aria-hidden="true"
                  data-home-capability-icon={capability.id}
                  focusable="false"
                  weight="duotone"
                />
              </span>
              <div className={styles.capabilityCopy}>
                <h2 className={styles.capabilityTitle}>{capability.title}</h2>
                <p className={styles.capabilityDescription}>
                  {capability.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type HomePageProps = {
  content?: HomeContent;
};

const HomePage: NextPage<HomePageProps> = ({ content = FALLBACK_HOME_CONTENT }) => {
  const { locale, dictionary } = useI18n();
  const [showHello, setShowHello] = useState(false);
  const [startIntro, setStartIntro] = useState(false);
  const [startName, setStartName] = useState(false);
  const [startRole, setStartRole] = useState(false);
  const roleWords = content.roleWords;
  const rolePhrases = roleWords.map((role, index) =>
    index === 0 || index === roleWords.length - 1
      ? `${content.rolePrefix}${role}`.trim()
      : role.trim(),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHello(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`home-page ${styles.root}`}
      data-home-layout="asymmetric-profile"
      suppressHydrationWarning
    >
      <div className={`home-slide ${styles.slide}`} data-home-viewport="adaptive">
        <div className={`home-shell ${styles.shell}`}>
          <Header disableRouteNavigation />

          <main className={`home-main ${styles.main}`}>
            <section
              className={`home-hero-copy ${styles.copy}`}
              aria-labelledby="home-title"
              data-home-hero
            >
              <div className={`home-hello ${styles.mobileHello}`}>
                <HelloBadge
                  text={dictionary.home.hello}
                  className="home-hello-badge"
                  show={showHello}
                  onDone={() => setStartIntro(true)}
                />
              </div>

              <h1
                id="home-title"
                className={`home-title ${styles.titleBlock}`}
                data-home-title
                  aria-label={`${content.introPrefix}${content.displayName} ${rolePhrases[0] ?? ""}`}
              >
                <span
                  className={`home-name-mark ${styles.name}`}
                  aria-hidden="true"
                >
                    <TypeText
                      text={content.introPrefix}
                      start={startIntro}
                      speedMs={42}
                      onDone={() => setStartName(true)}
                      className={styles.nameLead}
                    />
                    <TypeText
                      text={content.displayName}
                      start={startName}
                      speedMs={70}
                      onDone={() => setStartRole(true)}
                      className={styles.nameAccent}
                    />
                </span>
                <span
                  className={`home-role-line ${styles.role}`}
                  aria-hidden="true"
                  data-home-role-sequence={rolePhrases.join("|")}
                >
                  <span className={styles.roleVisual}>
                    <RoleCycler
                      start={startRole}
                      words={rolePhrases}
                      initialDelayMs={0}
                      firstDwellMs={1200}
                      dwellMs={520}
                      transitionMs={320}
                      effect="fadeSlide"
                      className="home-role-word"
                    />
                  </span>
                </span>
              </h1>

              <div
                className="home-hero-actions"
                data-home-actions
              >
                <Link
                  href={localizedPath("/projects-page", locale)}
                  className="home-projects-cta"
                >
                  <span>{dictionary.home.viewProjects}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 19 19 5M8 5h11v11" />
                  </svg>
                </Link>
                <DownloadCvButton
                  className="home-download-cta"
                  href="/api/cv"
                  downloadCV={dictionary.home.downloadCv}
                  downloadingLabel={dictionary.home.downloading}
                  downloadedLabel={dictionary.home.downloaded}
                  errorLabel={dictionary.home.downloadError}
                />
              </div>

              <HomeCapabilityGrid capabilities={content.capabilities} label={dictionary.home.capabilitiesLabel} />
            </section>

            <section
              className={`home-stage ${styles.stage}`}
              aria-label={dictionary.home.portraitLabel}
              data-home-stage
            >
              <div
                className={`home-portrait-anchor ${styles.portraitAnchor}`}
                data-home-portrait
              >
                <div className={`home-portrait-artbox ${styles.portraitArtbox}`}>
                  <MainPicPlaceholder
                    className={styles.portraitImage}
                    src="/home/portfolio-cutout-1600.webp"
                    sizes="(max-width: 1199px) 100vw, 47vw"
                  />
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
