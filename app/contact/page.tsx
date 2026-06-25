"use client";
import type { NextPage } from "next";
import { useCallback } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactIssueForm from "@/components/contact/ContactIssueForm";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const ContactPage: NextPage = () => {
  const { t } = useLanguage();
  const handleSend = useCallback(
    async ({ name, email, message, files }: { name: string; email: string; message: string; files: File[] }) => {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("message", message);
      for (const f of files) fd.append("files", f, f.name);

      try {
        const res = await fetch("/api/contact/send", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        return Boolean(res.ok && data?.ok);
      } catch {
        return false;
      }
    },
    []
  );

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-x-hidden overflow-hidden">
      <Header />
      <main className="contact-main relative z-10 flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="m-auto w-full max-w-[940px]">
          <div className="contact-intro mb-4 px-1 sm:mb-6">
            <h1 className="text-[22px] font-bold tracking-tight sm:text-[28px]" style={{ color: "var(--fg)" }}>{t("contact.title")}</h1>
            <p className="contact-intro-desc mt-1.5 max-w-xl text-[13.5px] sm:mt-2 sm:text-[15px]" style={{ lineHeight: 1.5, color: "var(--fg-70)" }}>
              {t("contact.intro")}
            </p>
          </div>
          <ContactIssueForm onSend={handleSend} />
        </div>
      </main>
      <Footer year={2026} owner="Mouaz Naji" logoSrc="/logo.svg" />
      <style>{`
        /* On short viewports, keep the intro compact so the form stays usable. */
        @media (max-height: 800px) {
          .contact-main { padding-top: 6px !important; padding-bottom: 4px !important; }
          .contact-intro { margin-bottom: 6px !important; }
          .contact-intro-desc { display: none !important; }
        }
        /* Very short phones need a tighter layout so the page stays scroll-free. */
        @media (max-height: 600px) {
          .contact-intro { display: none !important; }
          .contact-main { padding-top: 4px !important; padding-bottom: 2px !important; }
          .contact-issue .head-pane { padding-top: 6px !important; padding-bottom: 6px !important; }
          .contact-issue .main-pane { padding-top: 8px !important; padding-bottom: 8px !important; }
          .contact-issue .side-pane { padding-top: 6px !important; padding-bottom: 8px !important; }
          .contact-issue .comment-block { margin-top: 8px !important; }
          .contact-issue .comment-block > label { display: none !important; }
          .contact-issue .ce {
            min-height: 72px !important;
            max-height: 112px !important;
            padding: 8px 10px !important;
            font-size: 14px !important;
            line-height: 1.45 !important;
          }
          .contact-issue .toolbar-btn { height: 24px !important; width: 24px !important; }
          .contact-issue .toolbar-btn svg { width: 13px; height: 13px; }
          .contact-issue .comment-block > div > button {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
            font-size: 12px !important;
          }
          .contact-issue .submit-row { margin-top: 8px !important; gap: 6px !important; }
          .contact-issue .issue-submit { padding-top: 8px !important; padding-bottom: 8px !important; font-size: 14px !important; }
          .contact-issue .connect-head { margin-bottom: 6px !important; }
          .connect-grid { gap: 8px !important; padding-top: 2px !important; }
          .connect-grid .connect-link { max-width: 48px; }
          .connect-grid .connect-ico { width: 22px; height: 22px; }
          footer { padding-top: 8px !important; padding-bottom: 8px !important; }
          footer div:first-child { font-size: 12px; line-height: 1.2; }
        }
        @media (max-height: 520px) {
          .contact-main { padding-top: 2px !important; padding-bottom: 1px !important; }
          .contact-issue .head-pane { padding-top: 4px !important; padding-bottom: 4px !important; }
          .contact-issue .main-pane { padding-top: 6px !important; padding-bottom: 6px !important; }
          .contact-issue .side-pane { display: none !important; }
          .contact-issue .comment-block { margin-top: 4px !important; }
          .contact-issue .comment-block > label { display: none !important; }
          .contact-issue .comment-toolbar { display: none !important; }
          .contact-issue .attach-row { display: none !important; }
          .contact-issue .ce {
            min-height: 54px !important;
            max-height: 74px !important;
            padding: 6px 8px !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
          .contact-issue .grid.grid-cols-2 { gap: 6px !important; }
          .contact-issue input {
            padding: 8px 10px !important;
            font-size: 14px !important;
          }
          .contact-issue .submit-row { margin-top: 6px !important; gap: 4px !important; }
          .contact-issue .issue-submit { padding-top: 6px !important; padding-bottom: 6px !important; font-size: 13px !important; }
          footer { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;
