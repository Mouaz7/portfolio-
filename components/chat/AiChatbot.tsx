"use client";

import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type UiIcon = {
  svgPath: string;
  viewBox?: string;
};

const CHAT_INPUT_MAX = 12000;
const CHATBOT_ICON_FALLBACK: UiIcon = {
  svgPath:
    "M12 3v3m-5.5 4.5A4.5 4.5 0 0 1 11 6h2a4.5 4.5 0 0 1 4.5 4.5v4A4.5 4.5 0 0 1 13 19h-2a4.5 4.5 0 0 1-4.5-4.5v-4Zm-2 1.5h2m13 0h2M9.25 12h.01M14.75 12h.01M9.5 15c1.35.9 3.65.9 5 0",
  viewBox: "0 0 24 24",
};

const BotIcon = ({ icon = CHATBOT_ICON_FALLBACK, size = 20 }: { icon?: UiIcon; size?: number }) => (
  <svg width={size} height={size} viewBox={icon.viewBox ?? "0 0 24 24"} fill="none" aria-hidden="true">
    <path
      d={icon.svgPath}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m4 12 16-8-4 16-3.5-6.5L4 12Zm0 0 8.5 1.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function AiChatbot() {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const [chatIcon, setChatIcon] = useState<UiIcon>(CHATBOT_ICON_FALLBACK);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = useMemo(
    () => [t("chat.projectsQuick"), t("chat.skillsQuick"), t("chat.contactQuick")],
    [t]
  );

  useEffect(() => {
    setMessages((current) =>
      current.some((message) => message.role === "user")
        ? current
        : [{ role: "assistant", content: t("chat.initial") }]
    );
  }, [language, t]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ui-icons", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { icons: {} }))
      .then((data) => {
        const icon = data?.icons?.chatbot;
        if (!cancelled && icon?.svgPath) {
          setChatIcon({ svgPath: icon.svgPath, viewBox: icon.viewBox });
        }
      })
      .catch(() => {
        if (!cancelled) setChatIcon(CHATBOT_ICON_FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const syncInputState = () => {
    const nextHasInput = Boolean(inputRef.current?.value.trim());
    setHasInput((current) => (current === nextHasInput ? current : nextHasInput));
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;

    const textarea = event.currentTarget;
    const selectionStart = textarea.selectionStart ?? textarea.value.length;
    const selectionEnd = textarea.selectionEnd ?? textarea.value.length;
    const selectedLength = selectionEnd - selectionStart;
    const nextLength = textarea.value.length - selectedLength + pasted.length;

    if (nextLength <= CHAT_INPUT_MAX) return;

    event.preventDefault();
    const allowed = CHAT_INPUT_MAX - (textarea.value.length - selectedLength);
    textarea.setRangeText(pasted.slice(0, Math.max(0, allowed)), selectionStart, selectionEnd, "end");
    syncInputState();
  };

  const sendMessage = async (preset?: string) => {
    const text = (preset ?? inputRef.current?.value ?? "").trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    if (inputRef.current) inputRef.current.value = "";
    setHasInput(false);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, messages: nextMessages }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = typeof data?.reply === "string" && data.reply.trim() ? data.reply.trim() : t("chat.error");
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: t("chat.error") }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("chat.open")}
        onClick={() => setOpen(true)}
        className={[
          "group fixed bottom-5 right-5 z-[120] grid h-14 w-14 place-items-center rounded-2xl",
          "text-black transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          open ? "pointer-events-none scale-90 opacity-0" : "opacity-100",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(140deg, rgb(var(--accent-rgb)), color-mix(in srgb, rgb(var(--accent-rgb)) 65%, #6d8bff))",
          boxShadow: "0 12px 38px rgba(var(--accent-rgb),0.42)",
        }}
      >
        <span className="transition-transform duration-300 group-hover:scale-110">
          <BotIcon icon={chatIcon} size={26} />
        </span>
      </button>

      <section
        className={[
          "fixed bottom-5 z-[130] flex flex-col overflow-hidden rounded-lg",
          "border text-[var(--fg)]",
          "backdrop-blur-xl transition-all duration-300",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        ].join(" ")}
        style={{
          right: 16,
          background: "color-mix(in srgb, var(--surface) 90%, transparent)",
          borderColor: "var(--surface-border)",
          boxShadow: "0 22px 70px rgba(0,0,0,0.42)",
          maxHeight: "min(640px, calc(100dvh - 40px))",
          width: "min(390px, calc(100vw - 32px))",
        }}
        aria-label={t("chat.title")}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b px-3.5 py-3" style={{ borderColor: "var(--surface-border)" }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-black">
              <BotIcon icon={chatIcon} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold leading-tight">{t("chat.title")}</h2>
              <p className="truncate text-xs font-medium text-white/60">{t("chat.subtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("chat.close")}
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <CloseIcon />
          </button>
        </header>

        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={[
                "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "bg-accent text-black"
                  : "border text-white/88",
              ].join(" ")}
              style={{
                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                marginInlineStart: message.role === "user" ? "auto" : 0,
                marginInlineEnd: message.role === "assistant" ? "auto" : 0,
                background: message.role === "assistant" ? "rgba(var(--bg-rgb),0.26)" : undefined,
                borderColor: message.role === "assistant" ? "var(--surface-border)" : undefined,
                maxWidth: "86%",
                whiteSpace: "pre-wrap",
              }}
            >
              {message.content}
            </div>
          ))}
          {sending && (
            <div
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] text-white/70"
              style={{ background: "rgba(var(--bg-rgb),0.26)", borderColor: "var(--surface-border)", maxWidth: "86%" }}
            >
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
              {t("chat.sending")}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t p-3" style={{ borderColor: "var(--surface-border)" }}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={sending}
                className="rounded-md border px-2.5 py-1 text-xs font-semibold text-white/75 transition hover:border-accent/60 hover:text-accent disabled:opacity-50"
                style={{ borderColor: "var(--surface-border)" }}
              >
                {prompt}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              ref={inputRef}
              onInput={syncInputState}
              onPaste={handlePaste}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              maxLength={CHAT_INPUT_MAX}
              dir="auto"
              spellCheck
              placeholder={t("chat.placeholder")}
              className="max-h-40 min-h-12 flex-1 resize-none rounded-md border px-3 py-2 text-sm leading-5 text-white outline-none transition placeholder:text-white/40 focus:border-accent/70"
              style={{ background: "rgba(var(--bg-rgb),0.28)", borderColor: "var(--surface-border)" }}
            />
            <button
              type="submit"
              aria-label={t("chat.send")}
              disabled={sending || !hasInput}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
