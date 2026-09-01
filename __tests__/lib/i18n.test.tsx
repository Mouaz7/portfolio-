import { render, screen } from "@/tests/test-utils";
import { I18nProvider, useI18n } from "@/components/i18n/I18nProvider";
import ar from "@/lib/i18n/dictionaries/ar";
import sv from "@/lib/i18n/dictionaries/sv";
import {
  detectLocale,
  isLocale,
  localeDirection,
  localeFromPathname,
  localeTag,
  localizedPath,
  stripLocaleFromPathname,
} from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/types";
import { fallbackHomeContent } from "@/lib/home/types";

function LocaleProbe() {
  const { locale, dictionary, format } = useI18n();
  return <div>{locale}|{dictionary.nav.home}|{format(dictionary.common.open, { name: "repo" })}</div>;
}

describe("portfolio internationalization", () => {
  it("recognizes and extracts supported locales", () => {
    expect(isLocale("sv")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(localeFromPathname("/ar/projects-page")).toBe("ar");
    expect(localeFromPathname("/projects-page")).toBe("en");
    expect(stripLocaleFromPathname("/sv/projects-page")).toBe("/projects-page");
    expect(stripLocaleFromPathname("/ar")).toBe("/");
  });

  it("builds canonical English and prefixed localized paths", () => {
    expect(localizedPath("/sv/journey", "en")).toBe("/journey");
    expect(localizedPath("/projects-page", "sv")).toBe("/sv/projects-page");
    expect(localizedPath("/", "ar")).toBe("/ar");
  });

  it("detects browser preference by quality and exposes direction tags", () => {
    expect(detectLocale("en-US;q=0.5, ar;q=0.9, sv;q=0.8")).toBe("ar");
    expect(detectLocale("de-DE")).toBe("en");
    expect(detectLocale(null)).toBe("en");
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("sv")).toBe("ltr");
    expect(localeTag("sv")).toBe("sv-SE");
    expect(localeTag("ar")).toBe("ar");
    expect(localeTag("en")).toBe("en-US");
  });

  it("formats placeholders without removing unknown values", () => {
    expect(formatMessage("Open {name}", { name: "repo" })).toBe("Open repo");
    expect(formatMessage("{known} {unknown}", { known: 3 })).toBe("3 {unknown}");
    expect(formatMessage("Plain")).toBe("Plain");
  });

  it("provides the selected dictionary to client components", () => {
    render(
      <I18nProvider locale="sv" dictionary={sv}>
        <LocaleProbe />
      </I18nProvider>,
    );
    expect(screen.getByText("sv|Hem|Öppna repo")).toBeInTheDocument();
  });

  it("ships localized fallback home content for database rollouts", () => {
    expect(fallbackHomeContent("sv").introPrefix).toBe("Jag är ");
    expect(fallbackHomeContent("ar").displayName).toBe("معاذ");
    expect(fallbackHomeContent("en").displayName).toBe("Mouaz");
    expect(fallbackHomeContent("sv").roleWords).toEqual([
      "Mjukvaruingenjör",
      "Designer",
      "Utvecklare",
      "AI-utvecklare",
      "Webbutvecklare",
      "Cybersäkerhet",
      "Mjukvaruingenjör",
    ]);
    expect(fallbackHomeContent("ar").roleWords).toEqual([
      "مهندس برمجيات",
      "مصمم",
      "مطوّر",
      "مطوّر ذكاء اصطناعي",
      "مطوّر ويب",
      "الأمن السيبراني",
      "مهندس برمجيات",
    ]);
    expect(ar.nav.home).toBe("الرئيسية");
  });

  it("keeps corrected public copy in every dictionary", () => {
    expect(sv.contact.repositoryName).toBe("kontaktformulär");
    expect(sv.contact.maintainer).toBe("Ansvarig");
    expect(sv.contact.preview).toBe("Förhandsgranska");
    expect(sv.journey.commits).toBe("commits");
    expect(sv.journey.branches).toBe("branches");
    expect(sv.chatbot.label).toBe("Chattbot");
    expect(ar.journey.commits).toBe("التزامات");
    expect(ar.contact.sendStep).toBe("الرفع");
    expect(ar.home.hello).toBe("مرحبًا!");

    const activeCopy = JSON.stringify({ sv, ar });
    expect(activeCopy).not.toContain("Cybersäkerhetsingenjör");
    expect(activeCopy).not.toContain("عمليات اعتماد");
    expect(activeCopy).not.toContain("kontaktformular");
    expect(activeCopy).not.toContain("Förhandsvisa");
    expect(activeCopy).not.toContain("مهندس أمن سيبراني");
  });
});
