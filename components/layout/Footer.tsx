"use client";
import Image from "next/image";
import React from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  className?: string;
  year?: number;
  owner?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoW?: number;
  logoH?: number;
};

/**
 * Renders the site footer containing ownership notice and a brand logo.
 *
 * Displays a copyright line in the form:
 * "© {year} {owner}, All Rights Reserved"
 * alongside a responsive logo image.
 *
 * Responsive padding adjustments are applied via utility classes to
 * accommodate various viewport widths.
 *
 * @param className - Optional additional Tailwind / custom class names appended to the root <footer>.
 * @param year - The copyright year displayed in the notice. Defaults to 2025.
 * @param owner - The name or entity owning the site/content. Defaults to "Mouaz Naji".
 * @param logoSrc - The image source (path or URL) for the logo. Defaults to "/logo.svg".
 * @param logoAlt - Accessible alt text describing the logo. Defaults to "Logo".
 * @param logoW - The intrinsic width (in pixels) passed to the Next.js Image component. Defaults to 28.
 * @param logoH - The intrinsic height (in pixels) passed to the Next.js Image component. Defaults to 30.
 *
 * @returns A styled <footer> element containing a copyright notice and a logo image.
 *
 * @remarks
 * - The component expects that a Next.js Image component is available in scope.
 * - Ensures the logo scales naturally via a fixed width class (w-7) while preserving aspect ratio.
 * - Accepts further layout customization through the className prop.
 *
 * @example
 * <Footer year={2026} owner="Example Corp" logoSrc="/brand.svg" logoAlt="Example Corp Logo" />
 */
export default function Footer({
  className = "",
  year = 2026,
  owner = "Mouaz Naji",
  logoSrc = "/logo.svg",
  logoAlt = "Logo",
  logoW = 28,
  logoH = 30,
}: Props) {
  const { t } = useLanguage();

  return (
    <footer
      className={[
        "w-full flex items-center justify-between",
        "py-4",
        "px-[120px]",
        "max-[675px]:px-3",
        className,
      ].join(" ")}
    >
      <div className="tracking-[-0.5px] leading-[38px]">
        © {year} {owner}, {t("footer.rights")}
      </div>

      <Image
        className="w-7 h-auto"
        width={logoW}
        height={logoH}
        sizes="100vw"
        alt={logoAlt}
        src={logoSrc}
      />
    </footer>
  );
}
