"use client";
import "./contact-repository.css";

import type { NextPage } from "next";
import { useCallback } from "react";

import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import PhotoSocialContainer from "@/components/contact/photo-social-container";
import EmailForm from "@/components/contact/email-form";
import ContactRepositoryHeader from "@/components/contact/ContactRepositoryHeader";
import { fetchWithTurnstile } from "@/lib/security/turnstile-client";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { ContactSocialLink } from "@/lib/contact/social-links";

const MOBILE_FORM_CLASS = "w-full p-0";

type ContactPageProps = { initialLinks?: ContactSocialLink[] };

const ContactPage: NextPage<ContactPageProps> = ({ initialLinks }) => {
  const { dictionary } = useI18n();
  const handleSend = useCallback(
    async ({ name, email, message, files }: {
      name: string;
      email: string;
      message: string;
      files: File[];
    }) => {
      try {
        const prepareResponse = await fetchWithTurnstile("/api/contact/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            message,
            files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
          }),
        }, "contact");
        const prepared = await prepareResponse.json().catch(() => ({})) as {
          ok?: boolean;
          submissionId?: string;
          uploads?: Array<{ path: string; token: string }>;
        };
        if (!prepareResponse.ok || !prepared.ok || !prepared.submissionId) return false;

        if (files.length > 0) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
          if (!supabaseUrl || !supabaseKey || prepared.uploads?.length !== files.length) return false;
          const { createClient } = await import("@supabase/supabase-js");
          const storage = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
          }).storage.from("contact-uploads");
          for (let index = 0; index < files.length; index += 1) {
            const upload = prepared.uploads[index];
            const { error } = await storage.uploadToSignedUrl(upload.path, upload.token, files[index], {
              contentType: files[index].type,
              upsert: false,
            });
            if (error) return false;
          }
        }

        const sendResponse = await fetch("/api/contact/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: prepared.submissionId }),
        });
        const sent = await sendResponse.json().catch(() => ({})) as { ok?: boolean };
        return Boolean(sendResponse.ok && sent.ok);
      } catch {
        return false;
      }
    },
    [],
  );

  return (
    <div className="contact-page w-full min-h-[100dvh] relative overflow-x-hidden min-[676px]:overflow-hidden flex flex-col">
      <Header />

      <main className="contact-main flex-1 min-h-0 px-2 min-[676px]:px-6 relative z-10">
        <h1 className="sr-only">{dictionary.contact.title}</h1>
        <section className="contact-repository-shell" aria-label={dictionary.contact.repository}>
          <ContactRepositoryHeader />

          <div className="contact-repository-workspace">
            <div className="contact-phone-layout min-[676px]:hidden">
              <EmailForm
                idPrefix="contact-mobile"
                onSend={handleSend}
                showMobileIcons
                initialLinks={initialLinks}
                className={MOBILE_FORM_CLASS}
              />
            </div>

            <div className="contact-adaptive-layout hidden min-[676px]:flex h-full w-full items-center justify-center">
              <div className="contact-premium-shell grid w-full min-w-0 overflow-visible">
                <div
                  className="contact-profile-column contact-enter-left min-w-0 overflow-visible"
                >
                  <PhotoSocialContainer
                    className="contact-profile-card h-full w-full max-w-none"
                    initialLinks={initialLinks}
                  />
                </div>

                <div
                  className="contact-form-column contact-enter-right grid min-w-0 place-items-center overflow-visible"
                >
                  <EmailForm
                    idPrefix="contact-desktop"
                    onSend={handleSend}
                    className="contact-email-form w-full max-w-[820px]"
                    initialLinks={initialLinks}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer year={2026} owner="Mouaz Naji" />
    </div>
  );
};

export default ContactPage;
