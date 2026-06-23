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
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden" style={{ minHeight: "100dvh" }}>
      {/* Constellation backdrop is rendered globally in app/layout.tsx */}
      <Header />

      <main className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-6 md:py-10">
        {/* m-auto centers the block vertically when it fits, and still scrolls when it doesn't */}
        <div className="m-auto w-full max-w-[940px]">
          {/* intro */}
          <div className="mb-6 px-1">
            <h1 className="text-[24px] font-bold tracking-tight sm:text-[28px]" style={{ color: "var(--fg)" }}>Get in touch</h1>
            <p className="mt-2 max-w-xl text-[14px] sm:text-[15px]" style={{ lineHeight: 1.55, color: "var(--fg-70)" }}>
              Whether it&apos;s a collaboration, an opportunity, or just a friendly hello, I&apos;d love to hear from you. I&apos;ll get back to you soon.
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
