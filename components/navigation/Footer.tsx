"use client";
import MouazPremiumLogo from "@/components/brand/MouazPremiumLogo";
import { useI18n } from "@/components/i18n/I18nProvider";
import { localizedPath } from "@/lib/i18n/config";
import Link from "next/link";

type Props = {
  className?: string;
  year?: number;
  owner?: string;
};

export default function Footer({
  className = "",
  year = 2026,
  owner = "Mouaz Naji",
}: Props) {
  const { dictionary, locale } = useI18n();
  return (
    <footer
      className={[
        "site-footer w-full flex items-center justify-between",
        "gap-2",
        "py-3",
        "px-[120px]",
        "max-[676px]:px-3 max-[341px]:px-2 max-[341px]:text-[12px]",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "site-footer-copy whitespace-nowrap text-[13px] font-medium leading-tight tracking-normal",
          "text-[var(--fg-70)] min-[676px]:text-[14px]",
        ].join(" ")}
      >
        © {year} {owner}. {dictionary.footer.rights}
        {" · "}
        <Link
          href={localizedPath("/privacy", locale)}
          className="underline decoration-current/60 underline-offset-4 hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflowerblue-100/70"
        >
          {dictionary.footer.privacy}
        </Link>
      </div>

      <MouazPremiumLogo size="sm" />
    </footer>
  );
}
