"use client";

import type { NextPage } from "next";
import Image from "next/image";
import SocialIcon from "./SocialIcon";
import { useContactLinks } from "./use-contact-links";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { ContactSocialLink } from "@/lib/contact/social-links";

type PhotoSocialContainerType = {
  className?: string;
  initialLinks?: ContactSocialLink[];
};

const PhotoSocialContainer: NextPage<PhotoSocialContainerType> = ({
  className = "",
  initialLinks,
}) => {
  const { dictionary } = useI18n();
  const copy = dictionary.contact;
  const links = useContactLinks(true, initialLinks);

  return (
    <section
      className={[
        "contact-portrait-panel relative flex h-full w-full flex-col items-center justify-center",
        className,
      ].join(" ")}
      aria-label={copy.portrait}
    >
      <div className="contact-profile-heading">
        <div>
          <span className="contact-profile-role" title={copy.maintainer}>
            <svg aria-hidden viewBox="0 0 16 16"><path d="M3 2.25h7l3 3v8.5H3V2.25Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M10 2.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
            README.md
          </span>
          <h2>Mouaz Naji</h2>
          <span className="contact-profile-handle">{copy.maintainerHandle}</span>
        </div>
        <span className="contact-profile-verified">
          <svg aria-hidden viewBox="0 0 16 16"><path d="m3.6 8.2 2.6 2.6 6.2-6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {copy.profileVerified}
        </span>
      </div>

      <div className="contact-profile-portrait-row">
        <div className="contact-portrait-frame relative overflow-hidden">
          <div className="contact-portrait-aura" aria-hidden="true" />
          <Image
            src="/home/portfolio-cutout-1600.webp"
            alt="Mouaz Naji"
            fill
            priority
            sizes="(min-width: 1200px) 310px, (min-width: 900px) 270px, (min-width: 676px) 230px, 80vw"
            className="relative z-[2] object-contain object-bottom"
          />
        </div>
      </div>

      <div className="contact-profile-details">
        <div className="contact-profile-terminal" aria-label={copy.maintainerBio}>
          <code><span>$</span> git config user.name &quot;Mouaz Naji&quot;</code>
          <p>{copy.maintainerBio}</p>
        </div>

        <div className="contact-profile-branch-row">
          <span>
            <svg aria-hidden viewBox="0 0 16 16"><circle cx="4" cy="3" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="4" cy="13" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M4 4.5v7M5.5 8h2A4.5 4.5 0 0 0 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
            {copy.branch}
          </span>
          <span><i aria-hidden />{copy.gitStatus}</span>
        </div>

        {links.length > 0 && (
          <div className="contact-portrait-links" aria-label={copy.socialLinks}>
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.title}
                title={link.title}
                className="contact-profile-social-link"
              >
                <SocialIcon link={link} size={22} className="h-[22px] w-[22px] select-none object-contain pointer-events-none" />
                <span>{link.href.toLowerCase().includes("github.com") ? "Mouaz7" : link.title}</span>
              </a>
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PhotoSocialContainer;
