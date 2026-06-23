"use client";
import type { NextPage } from "next";
import { useCallback } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactIssueForm from "@/components/contact/ContactIssueForm";

const ContactPage: NextPage = () => {
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
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      {/* Constellation backdrop is rendered globally in app/layout.tsx */}
      <Header />

      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto w-full max-w-[940px]">
          {/* intro */}
          <div className="mb-5 px-1">
            <h1 className="font-bold tracking-tight" style={{ fontSize: 26, color: "var(--fg)" }}>Get in touch</h1>
            <p className="mt-1 font-mono" style={{ fontSize: 13, color: "var(--fg-50)" }}>
              <span style={{ color: "var(--accent)" }}>$</span> open an issue — collaborations, opportunities, or just a chat. I&apos;ll reply soon.
            </p>
          </div>

          <ContactIssueForm onSend={handleSend} />
        </div>
      </main>

      <Footer year={2026} owner="Mouaz Naji" logoSrc="/logo.svg" />
    </div>
  );
};

export default ContactPage;
