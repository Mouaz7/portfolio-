import Link from "next/link";
import Footer from "@/components/navigation/Footer";
import Header from "@/components/navigation/Header";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizedPageMetadata } from "@/lib/page-metadata";
import styles from "./privacy.module.css";

export const generateMetadata = () => localizedPageMetadata("privacy", "/privacy");

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const dictionary = await getDictionary(locale);
  const copy = dictionary.privacy;

  return (
    <div className={styles.page} data-privacy-page>
      <Header disableRouteTouch />
      <main className={styles.main}>
        <article className={styles.article} aria-labelledby="privacy-title">
          <header className={styles.intro}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 id="privacy-title">{copy.title}</h1>
            <p>{copy.intro}</p>
            <small>{copy.reviewed}</small>
          </header>

          <section>
            <h2>{copy.preferencesTitle}</h2>
            <p>{copy.preferencesBody}</p>
          </section>

          <section>
            <h2>{copy.contactTitle}</h2>
            <p>{copy.contactBody}</p>
            <p>{copy.contactValidity}</p>
            <p>{copy.contactCleanup}</p>
            <p>{copy.contactDelivery}</p>
          </section>

          <section>
            <h2>{copy.aiTitle}</h2>
            <p>{copy.aiBody}</p>
            <p className={styles.warning}>{copy.aiWarning}</p>
          </section>

          <section>
            <h2>{copy.performanceTitle}</h2>
            <p>{copy.performanceBody}</p>
          </section>

          <section>
            <h2>{copy.attachmentsTitle}</h2>
            <p>{copy.attachmentsBody}</p>
          </section>

          <section>
            <h2>{copy.questionsTitle}</h2>
            <p>{copy.questionsBody}</p>
            <Link className={styles.contactLink} href={localizedPath("/contact", locale)}>
              {copy.contactLink}
            </Link>
          </section>
        </article>
      </main>
      <Footer className={styles.footer} />
    </div>
  );
}
