"use client";

import { usePathname } from "next/navigation";
import { TranslateIcon } from "@phosphor-icons/react/dist/csr/Translate";
import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  localeCookie,
  localeNames,
  locales,
  localizedPath,
  type Locale,
} from "@/lib/i18n/config";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const { locale, dictionary } = useI18n();
  const [open, setOpen] = useState(false);

  const rememberLocale = (nextLocale: Locale) => {
    document.cookie = `${localeCookie}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setOpen(false);
  };

  return (
    <div
      className={["site-language-switcher relative", className].join(" ")}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl border border-[var(--surface-border)] bg-[rgba(var(--bg-rgb),0.18)] px-2 text-[var(--fg)] backdrop-blur-md transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        aria-label={dictionary.nav.chooseLanguage}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <TranslateIcon size={18} aria-hidden="true" />
        <span className="text-xs font-bold uppercase">{locale}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={dictionary.nav.chooseLanguage}
          className="absolute end-0 top-[calc(100%+0.5rem)] z-[110] min-w-36 overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[rgba(var(--bg-rgb),0.96)] p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {locales.map((nextLocale) => (
            <a
              key={nextLocale}
              href={localizedPath(pathname, nextLocale)}
              hrefLang={nextLocale}
              lang={nextLocale}
              dir={nextLocale === "ar" ? "rtl" : "ltr"}
              role="menuitemradio"
              aria-checked={locale === nextLocale}
              onClick={() => rememberLocale(nextLocale)}
              className="flex min-h-10 items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--fg)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <span>{localeNames[nextLocale]}</span>
              {locale === nextLocale && <span aria-hidden="true">✓</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
