"use client";
import MouazPremiumLogo from "@/components/brand/MouazPremiumLogo";
import { useI18n } from "@/components/i18n/I18nProvider";

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
  const { dictionary } = useI18n();
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
      </div>

      <MouazPremiumLogo size="sm" />
    </footer>
  );
}
