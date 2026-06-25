"use client";
import React, { useEffect, useRef, useState } from "react";
import { isValidEmail, NAME_MAX, EMAIL_MAX, MESSAGE_MAX } from "@/lib/contact/validate";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type LinkItem = { id: number; title: string; href: string; svgPath: string; viewBox?: string; color?: string | null };
type LabelItem = { id: number; text: string; color: string };
type IconDef = { svgPath: string; viewBox?: string };
type SendFn = (p: { name: string; email: string; message: string; files: File[] }) => Promise<boolean> | boolean;

const MAX_TOTAL_MB = 10;
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx";
const GREEN = "#2da44e";

/* small inline icons */
const Ico = ({ d, s = 16, vb = "0 0 16 16" }: { d: string; s?: number; vb?: string }) => (
  <svg width={s} height={s} viewBox={vb} fill="currentColor" aria-hidden>
    <path d={d} />
  </svg>
);
const I = {
  bold: "M4 2h4.5a3.5 3.5 0 0 1 2.4 6.05A3.5 3.5 0 0 1 9 14H4V2Zm2 2v3h2.5a1.5 1.5 0 0 0 0-3H6Zm0 5v3h3a1.5 1.5 0 0 0 0-3H6Z",
  italic: "M6 2h6v2H9.7l-2 8H10v2H4v-2h2.3l2-8H6V2Z",
  code: "M5.7 4.3 1.99 8l3.7 3.7-1.4 1.4L-.83 8l4.12-5.1L5.7 4.3Zm4.6 0L14 8l-3.7 3.7 1.4 1.4L15.83 8l-4.12-5.1L10.3 4.3Z",
  link: "M7.78 1.97a3.5 3.5 0 0 1 4.95 4.95l-1.5 1.5-1.06-1.06 1.5-1.5a2 2 0 0 0-2.83-2.83l-1.5 1.5L6.28 3.47l1.5-1.5ZM3.47 6.28 4.53 7.34l-1.5 1.5a2 2 0 1 0 2.83 2.83l1.5-1.5 1.06 1.06-1.5 1.5a3.5 3.5 0 1 1-4.95-4.95l1.5-1.5Zm1.06 4.25L10.53 4.53 9.47 3.47 3.47 9.47l1.06 1.06Z",
  quote: "M2 3h12v2H2V3Zm0 4h8v2H2V7Zm0 4h12v2H2v-2Z",
  list: "M2 3h2v2H2V3Zm4 .5h8v1H6v-1Zm0 4h8v1H6v-1Zm0 4h8v1H6v-1ZM2 7h2v2H2V7Zm0 4h2v2H2v-2Z",
  gear: "M8 4.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm1.5-7c.38 0 .7.28.74.65l.13.97c.43.13.83.3 1.2.53l.78-.6a.75.75 0 0 1 .99.07l1.02 1.02c.27.27.3.7.07.99l-.6.78c.23.37.4.77.53 1.2l.97.13c.37.04.65.36.65.74v1.44c0 .38-.28.7-.65.74l-.97.13c-.13.43-.3.83-.53 1.2l.6.78a.75.75 0 0 1-.07.99l-1.02 1.02a.75.75 0 0 1-.99.07l-.78-.6c-.37.23-.77.4-1.2.53l-.13.97a.75.75 0 0 1-.74.65H7.28a.75.75 0 0 1-.74-.65l-.13-.97a5.5 5.5 0 0 1-1.2-.53l-.78.6a.75.75 0 0 1-.99-.07L2.42 11.7a.75.75 0 0 1-.07-.99l.6-.78a5.5 5.5 0 0 1-.53-1.2l-.97-.13A.75.75 0 0 1 .8 7.86V6.42c0-.38.28-.7.65-.74l.97-.13c.13-.43.3-.83.53-1.2l-.6-.78a.75.75 0 0 1 .07-.99l1.02-1.02a.75.75 0 0 1 .99-.07l.78.6c.37-.23.77-.4 1.2-.53l.13-.97A.75.75 0 0 1 7.28 1H8Z",
};

/* convert the rich-text editor's HTML into clean markdown for the email */
function serialize(root: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join("");
    switch (tag) {
      case "b": case "strong": return `**${inner}**`;
      case "i": case "em": return `*${inner}*`;
      case "code": return "`" + inner + "`";
      case "a": return `[${inner}](${el.getAttribute("href") || ""})`;
      case "blockquote": return inner.split("\n").filter(Boolean).map((l) => `> ${l}`).join("\n") + "\n";
      case "li": return `- ${inner}\n`;
      case "ul": case "ol": return inner;
      case "br": return "\n";
      case "div": case "p": return inner + "\n";
      default: return inner;
    }
  };
  return Array.from(root.childNodes).map(walk).join("").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Contact form styled as a GitHub "Open a new issue" page, but with a
 * Google-Docs-style WYSIWYG editor — toolbar buttons format the selected
 * text instantly. Cohesive with the git-graph roadmap / GitHub projects page.
 */
export default function ContactIssueForm({ onSend }: { onSend: SendFn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [textLen, setTextLen] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [icons, setIcons] = useState<Record<string, IconDef>>({});
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const edRef = useRef<HTMLDivElement>(null);
  const { t, dir } = useLanguage();

  // social links + selectable labels, both fully database driven
  useEffect(() => {
    fetch("/api/contact")
      .then((r) => (r.ok ? r.json() : { socials: [], labels: [] }))
      .then((d) => {
        if (Array.isArray(d?.socials)) setLinks(d.socials);
        if (Array.isArray(d?.labels)) setLabels(d.labels);
        if (d?.icons && typeof d.icons === "object") setIcons(d.icons);
      })
      .catch(() => {});
  }, []);

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const overSize = totalBytes > MAX_TOTAL_MB * 1024 * 1024;

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const map = new Map(files.map((f) => [f.name + f.size + f.lastModified, f]));
    for (const f of Array.from(picked)) map.set(f.name + f.size + f.lastModified, f);
    setFiles(Array.from(map.values()));
  };
  const removeFile = (key: string) => setFiles((fs) => fs.filter((f) => f.name + f.size + f.lastModified !== key));

  const syncLen = () => setTextLen((edRef.current?.innerText || "").trim().length);

  // format the current selection instantly (Google-Docs style)
  const exec = (cmd: string, val?: string) => {
    edRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncLen();
  };
  const applyCode = () => {
    const sel = window.getSelection();
    const text = sel?.toString() || "";
    if (!text) return;
    const esc = text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
    edRef.current?.focus();
    document.execCommand("insertHTML", false, `<code>${esc}</code>​`);
    syncLen();
  };
  const applyLink = () => {
    const url = window.prompt(t("contact.linkUrlPrompt"), "https://");
    if (url) exec("createLink", url);
  };

  const tools: { k: keyof typeof I; fn: () => void; t: string }[] = [
    { k: "bold", fn: () => exec("bold"), t: `${t("contact.tools.bold")} (Ctrl+B)` },
    { k: "italic", fn: () => exec("italic"), t: `${t("contact.tools.italic")} (Ctrl+I)` },
    { k: "code", fn: applyCode, t: t("contact.tools.code") },
    { k: "link", fn: applyLink, t: `${t("contact.tools.link")} (Ctrl+K)` },
    { k: "quote", fn: () => exec("formatBlock", "blockquote"), t: t("contact.tools.quote") },
    { k: "list", fn: () => exec("insertUnorderedList"), t: t("contact.tools.list") },
  ];

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      applyLink();
    }
  };

  const toggleLabel = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // gear icon is database driven (ui_icon), with the inline path as a fallback
  const Gear = ({ s = 19 }: { s?: number }) => {
    const g = icons.gear;
    return <Ico d={g?.svgPath || I.gear} s={s} vb={g?.viewBox || "0 0 16 16"} />;
  };

  const submit = async () => {
    setError("");
    const body = edRef.current ? serialize(edRef.current) : "";
    if (!name.trim() || !email.trim() || !body.trim()) return setError(t("contact.errors.required"));
    if (!isValidEmail(email)) return setError(t("contact.errors.invalidEmail"));
    if (body.length > MESSAGE_MAX) return setError(`${t("contact.errors.tooLong")} (${body.length}/${MESSAGE_MAX}).`);
    if (overSize) return setError(`${t("contact.errors.attachments")} ${MAX_TOTAL_MB} MB.`);
    // selected labels are attached to the message so I see the intent of the inquiry
    const labelLine = picked.length ? `${t("contact.labels")}: ${picked.join(", ")}\n\n` : "";
    const message = labelLine + body;
    setStatus("sending");
    const ok = await onSend({ name, email, message, files });
    setStatus(ok ? "ok" : "error");
    if (ok) {
      setName("");
      setEmail("");
      setFiles([]);
      setPicked([]);
      if (edRef.current) edRef.current.innerHTML = "";
      setTextLen(0);
    }
  };

  // soft, always-on neon glow (like the reference design) and a stronger focus glow
  const glowIdle = "0 0 0 1px color-mix(in srgb, var(--gh-link) 16%, transparent), 0 3px 16px color-mix(in srgb, var(--gh-link) 12%, transparent)";
  const glowFocus = "0 0 0 3px color-mix(in srgb, var(--gh-link) 26%, transparent), 0 4px 22px color-mix(in srgb, var(--gh-link) 22%, transparent)";
  const field: React.CSSProperties = {
    width: "100%", borderRadius: 10, padding: "11px 13px", fontSize: 16, color: "var(--fg)",
    background: "color-mix(in srgb, var(--surface) 50%, transparent)",
    border: "1px solid color-mix(in srgb, var(--gh-link) 35%, var(--surface-border))", outline: "none",
    boxShadow: glowIdle, transition: "border-color .15s, box-shadow .15s",
  };
  const label = "mb-1.5 block text-[13px] font-semibold";
  const over = textLen > MESSAGE_MAX;

  return (
    <div
      className="contact-issue mx-auto w-full max-w-[940px] overflow-hidden rounded-2xl opacity-0"
      style={{
        background: "color-mix(in srgb, var(--surface) 92%, transparent)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--surface-border)", boxShadow: "none",
      }}
    >
      {/* header */}
      <div className="head-pane flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 min-[380px]:px-5 sm:px-6" style={{ borderBottom: "1px solid color-mix(in srgb, var(--surface-border) 60%, transparent)" }}>
        <div className="flex min-w-0 items-center gap-2 font-mono" style={{ fontSize: 15, color: "var(--fg)" }}>
          <Ico s={18} d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          <span className="font-semibold" style={{ color: "var(--fg-70)" }}>Mouaz7</span>
          <span style={{ color: "var(--fg-50)" }}>/</span>
          <span className="font-bold" style={{ color: "var(--gh-link)" }}>{t("nav.contact").toLowerCase()}</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono font-semibold" style={{ fontSize: 11.5, color: GREEN, background: `${GREEN}1f`, border: `1px solid ${GREEN}55` }}>
          <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: GREEN }} />
          {t("contact.openIssue")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_252px]">
        {/* MAIN */}
        <div className="main-pane min-w-0 px-4 py-5 min-[380px]:px-5 sm:px-6">
          {status === "ok" ? (
            <div className="grid place-items-center py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: `${GREEN}22`, border: `1px solid ${GREEN}66` }}>
                <Ico s={28} d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.78 6.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 1 1 1.06 1.06Z" />
              </div>
              <h3 className="mt-3 font-bold" style={{ color: "var(--fg)", fontSize: 18 }}>{t("contact.sentTitle")}</h3>
              <p className="mt-1 font-medium" style={{ color: "var(--fg-70)", fontSize: 14 }}>{t("contact.sentBody")}</p>
              <button onClick={() => setStatus("idle")} className="mt-4 rounded-md px-4 py-1.5 font-mono font-semibold" style={{ fontSize: 13, color: "var(--gh-link)", border: "1px solid var(--surface-border)", background: "color-mix(in srgb, var(--surface) 50%, transparent)" }}>
                {t("contact.openAnother")}
              </button>
            </div>
          ) : (
            <>
              {/* name + email */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div>
                  <label className={label} style={{ color: "var(--fg)" }} htmlFor="c-name">{t("contact.yourName")}</label>
                  <input id="c-name" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))} placeholder="Jane Doe" style={field} onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gh-link)"; e.currentTarget.style.boxShadow = glowFocus; }} onBlur={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--gh-link) 35%, var(--surface-border))"; e.currentTarget.style.boxShadow = glowIdle; }} />
                </div>
                <div>
                  <label className={label} style={{ color: "var(--fg)" }} htmlFor="c-email">{t("contact.yourEmail")}</label>
                  <input id="c-email" type="email" value={email} maxLength={EMAIL_MAX} onChange={(e) => setEmail(e.target.value.slice(0, EMAIL_MAX))} placeholder="jane@example.com" style={field} onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gh-link)"; e.currentTarget.style.boxShadow = glowFocus; }} onBlur={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--gh-link) 35%, var(--surface-border))"; e.currentTarget.style.boxShadow = glowIdle; }} />
                </div>
              </div>

              {/* comment editor (WYSIWYG) with avatar bubble */}
              <div className="comment-block mt-4">
                <label className={label} style={{ color: "var(--fg)" }}>{t("contact.addComment")}</label>
                <div className="flex gap-2.5">
                  <div className="hidden shrink-0 lg:block">
                    <div className="grid h-9 w-9 place-items-center rounded-full font-bold" style={{ background: "var(--accent)", color: "#04201b", fontSize: 16 }}>M</div>
                  </div>
                  <div
                    className="relative min-w-0 flex-1 overflow-hidden rounded-lg"
                    style={{ border: `1px solid color-mix(in srgb, var(--gh-link) ${dragging ? 100 : 35}%, var(--surface-border))`, boxShadow: dragging ? glowFocus : glowIdle, transition: "box-shadow .15s, border-color .15s" }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                  >
                    {dragging && (
                      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center" style={{ background: "color-mix(in srgb, var(--gh-link) 12%, var(--surface))" }}>
                        <span className="font-mono font-semibold" style={{ fontSize: 13, color: "var(--gh-link)" }}>{t("contact.dropFiles")}</span>
                      </div>
                    )}
                    <span aria-hidden className="absolute hidden lg:block" style={{ left: -7, top: 13, width: 12, height: 12, transform: "rotate(45deg)", background: "color-mix(in srgb, var(--surface) 45%, transparent)", borderLeft: "1px solid var(--surface-border)", borderBottom: "1px solid var(--surface-border)" }} />

                    {/* toolbar — formats instantly */}
                    <div className="comment-toolbar flex flex-wrap items-center gap-0.5 px-2 py-1.5" style={{ background: "color-mix(in srgb, var(--surface) 45%, transparent)", borderBottom: "1px solid var(--surface-border)" }}>
                      {tools.map(({ k, fn, t }, i) => (
                        <React.Fragment key={k}>
                          {(i === 2 || i === 4) && <span className="mx-1 h-4 w-px" style={{ background: "var(--surface-border)" }} />}
                          <button type="button" title={t} onMouseDown={(e) => e.preventDefault()} onClick={fn} className="toolbar-btn grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-[var(--gh-row-hover)]" style={{ color: "var(--fg-70)" }}>
                            <Ico d={I[k]} s={15} />
                          </button>
                        </React.Fragment>
                      ))}
                      <span className="ml-auto pr-1 font-mono" style={{ fontSize: 11.5, color: over ? "#f85149" : "var(--fg-70)" }}>{textLen}/{MESSAGE_MAX}</span>
                    </div>

                    {/* the editable surface */}
                    <div
                      ref={edRef}
                      className="ce min-h-[160px] w-full px-4 py-3"
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-multiline="true"
                      data-ph={t("contact.commentPlaceholder")}
                      dir={dir}
                      onInput={syncLen}
                      onKeyDown={onKey}
                      style={{ fontSize: 15, lineHeight: 1.6, color: "var(--fg)", background: "color-mix(in srgb, var(--surface) 60%, transparent)" }}
                    />

                    {/* attach */}
                    <button type="button" onClick={() => fileRef.current?.click()} className="attach-row flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--gh-row-hover)]" style={{ fontSize: 13, color: "var(--fg-70)", borderTop: "1px solid var(--surface-border)", background: "color-mix(in srgb, var(--surface) 45%, transparent)" }}>
                      <Ico s={15} d="M3.5 6.5v3.25a4.25 4.25 0 0 0 8.5 0V4.5a2.75 2.75 0 1 0-5.5 0v5.25a1.25 1.25 0 1 0 2.5 0V6.5a.75.75 0 0 1 1.5 0v3.25a2.75 2.75 0 1 1-5.5 0V4.5a4.25 4.25 0 0 1 8.5 0v5.25a5.75 5.75 0 1 1-11.5 0V6.5a.75.75 0 0 1 1.5 0Z" />
                      {t("contact.attachFiles")}
                      <span className="ml-auto font-mono" style={{ fontSize: 11 }}>{t("contact.max")} {MAX_TOTAL_MB} MB</span>
                    </button>
                    <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
                  </div>
                </div>

                {/* attachment chips */}
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 lg:pl-[46px]">
                    {files.map((f) => {
                      const key = f.name + f.size + f.lastModified;
                      return (
                        <span key={key} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono" style={{ fontSize: 11.5, color: "var(--fg-70)", background: "color-mix(in srgb, var(--surface) 55%, transparent)", border: `1px solid ${overSize ? "#f85149" : "var(--surface-border)"}` }}>
                          {f.name.length > 22 ? f.name.slice(0, 12) + "…" + f.name.slice(-7) : f.name}
                          <span style={{ color: "var(--fg-50)" }}>{(f.size / (1024 * 1024)).toFixed(1)}MB</span>
                          <button onClick={() => removeFile(key)} aria-label={t("common.remove")} style={{ color: "var(--fg-50)" }}>✕</button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <p className="mt-2 hidden items-start gap-1.5 lg:flex lg:pl-[46px]" style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-70)" }}>
                  <Ico s={14} d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 7.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4ZM8 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /> <span>{t("contact.formatHint")}</span>
                </p>
              </div>

              {(error || status === "error" || overSize || over) && (
                <div className="mt-3 rounded-md px-3 py-2 lg:ml-[46px]" style={{ fontSize: 13, color: "#f85149", background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.4)" }}>
                  {error || (over ? `${t("contact.errors.tooLong")} (${textLen}/${MESSAGE_MAX}).` : overSize ? `${t("contact.errors.attachments")} ${MAX_TOTAL_MB} MB.` : t("contact.errors.send"))}
                </div>
              )}

              <div className="submit-row mt-4 flex flex-col-reverse items-stretch gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
                <span className="text-center font-mono lg:text-left" style={{ fontSize: 12, color: "var(--fg-70)" }}>{t("contact.nameCount")} {name.length}/{NAME_MAX} · {t("contact.emailCount")} {email.length}/{EMAIL_MAX}</span>
                <button onClick={submit} disabled={status === "sending"} className="issue-submit flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all disabled:opacity-60 lg:w-auto lg:rounded-md lg:py-2" style={{ fontSize: 15, color: "#fff", background: GREEN, border: `1px solid ${GREEN}`, boxShadow: `0 4px 14px ${GREEN}55` }}>
                  {status === "sending" ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {t("contact.submitting")}
                    </>
                  ) : (
                    <>
                      <Ico s={15} d="M7.75 2a.75.75 0 0 1 .75.75V8h5.25a.75.75 0 0 1 0 1.5H8.5v5.25a.75.75 0 0 1-1.5 0V9.5H1.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
                      {t("contact.submitIssue")}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="side-pane px-4 py-5 min-[380px]:px-5 sm:px-6">
          {/* Assignees — desktop only (cleaner, app-like mobile keeps just the form + Connect) */}
          <div className="hidden pb-4 lg:block" style={{ borderBottom: "1px solid color-mix(in srgb, var(--surface-border) 60%, transparent)" }}>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold" style={{ color: "var(--fg-70)" }}>
              {t("contact.assignees")} <span style={{ color: "var(--fg)" }}><Gear s={19} /></span>
            </div>
            <a href={links.find((l) => /github/i.test(l.title))?.href || "https://github.com/Mouaz7"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ fontSize: 13.5, color: "var(--fg)" }}>
              <span className="grid h-6 w-6 place-items-center rounded-full font-bold" style={{ background: "var(--accent)", color: "#04201b", fontSize: 12 }}>M</span>
              <span className="font-semibold">Mouaz7</span>
            </a>
          </div>

          {/* Labels — desktop only */}
          {labels.length > 0 && (
          <div className="hidden py-4 lg:block" style={{ borderBottom: "1px solid color-mix(in srgb, var(--surface-border) 60%, transparent)" }}>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold" style={{ color: "var(--fg-70)" }}>
              {t("contact.labels")} <span style={{ color: "var(--fg)" }}><Gear s={19} /></span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const on = picked.includes(l.text);
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleLabel(l.text)}
                    className="label-pill flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono transition-all"
                    style={{
                      fontSize: 11,
                      fontWeight: on ? 700 : 500,
                      color: on ? "#fff" : l.color,
                      background: on ? l.color : `color-mix(in srgb, ${l.color} 14%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${l.color} ${on ? 90 : 45}%, transparent)`,
                      boxShadow: on ? `0 0 10px color-mix(in srgb, ${l.color} 50%, transparent)` : "none",
                    }}
                  >
                    {on ? <Ico s={11} d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /> : <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: l.color }} />}
                    {l.text}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 leading-snug" style={{ fontSize: 12, color: "var(--fg-70)" }}>
              {picked.length ? `${picked.length} ${t("contact.selectedAdded")}` : t("contact.tapLabels")}
            </p>
          </div>
          )}

          {links.length > 0 && (
          <div className="pt-4">
            <div className="connect-head mb-3 text-center text-[13px] font-semibold lg:mb-2.5 lg:text-left" style={{ color: "var(--fg-70)" }}>{t("contact.connect")}</div>
            <div className="connect-grid flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="connect-link group flex items-center gap-3 rounded-md px-1.5 py-2 transition-all"
                  style={{ fontSize: 15, color: "var(--fg)", ["--brand" as string]: l.color || "var(--gh-link)" } as React.CSSProperties}
                >
                  <svg className="connect-ico shrink-0" width="26" height="26" viewBox={l.viewBox || "0 0 24 24"} fill="currentColor" style={{ color: l.color || "var(--gh-link)" }} aria-hidden>
                    <path d={l.svgPath} />
                  </svg>
                  <span className="connect-title hidden font-semibold lg:inline">{l.title}</span>
                  <svg className="connect-chevron ml-auto hidden shrink-0 opacity-0 transition-opacity group-hover:opacity-100 lg:block" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--fg-50)" }} aria-hidden>
                    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          )}
        </aside>
      </div>

      <style>{`
        @keyframes issueIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: none; } }
        .contact-issue { animation: issueIn .5s cubic-bezier(.2,.7,.2,1) both; }
        .issue-submit { box-shadow: none; }
        .issue-submit:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: none; }
        .connect-link:hover { background: var(--gh-row-hover); transform: translateX(2px); }
        .contact-issue input::placeholder { color: var(--fg-50); opacity: 1; }
        .ce { outline: none; overflow-y: auto; overflow-x: hidden; max-height: 360px; overflow-wrap: anywhere; word-break: break-word; }
        .ce:empty:before { content: attr(data-ph); color: var(--fg-70); opacity: .85; pointer-events: none; }
        .ce code { padding: .12em .35em; border-radius: 4px; background: color-mix(in srgb, var(--surface) 50%, transparent); border: 1px solid var(--surface-border); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
        .ce a { color: var(--gh-link); text-decoration: underline; }
        .ce blockquote { border-left: 3px solid var(--surface-border); margin: 4px 0; padding-left: 12px; color: var(--fg-70); }
        .ce ul { padding-left: 22px; list-style: disc; margin: 4px 0; }
        .ce ol { padding-left: 22px; list-style: decimal; margin: 4px 0; }
        /* On desktop the form is the LEFT column, so it keeps a divider under it.
           On mobile the form stacks ON TOP of the Connect section, where that same
           divider made the bottom look like a separate nested box — so it's only
           applied at the lg layout breakpoint. */
        @media (min-width: 1024px) {
          .contact-issue .main-pane { border-bottom: 1px solid color-mix(in srgb, var(--surface-border) 60%, transparent); }
        }
        /* mobile/tablet (single-column, below the lg layout breakpoint):
           one consistent mobile experience across every phone size */
        @media (max-width: 1023.98px) {
          /* Compact the form so the whole contact page fits a phone screen without
             scrolling (the form keeps the same size across all phones). */
          .contact-issue .ce { font-size: 16px; min-height: 78px; max-height: 180px; }
          .contact-issue input { font-size: 16px; }
          .contact-issue .head-pane { padding-top: 9px; padding-bottom: 9px; }
          .contact-issue .main-pane { padding-top: 12px; padding-bottom: 12px; }
          .contact-issue .side-pane { padding-top: 10px; padding-bottom: 12px; }
          /* tighten vertical rhythm so the whole card fits a small phone screen */
          .contact-issue .comment-block { margin-top: 12px; }
          .contact-issue .submit-row { margin-top: 12px; }
          .contact-issue .connect-head { margin-bottom: 8px; }
          /* Connect becomes one row of round, brand-glowing icon buttons (always 4 across) */
          .connect-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; justify-items: center; padding-top: 6px; }
          .connect-grid .connect-link {
            width: 100%; max-width: 56px; aspect-ratio: 1; padding: 0; justify-content: center; gap: 0;
            border-radius: 50%;
            border: 1.5px solid color-mix(in srgb, var(--brand) 48%, var(--surface-border));
            background: color-mix(in srgb, var(--brand) 10%, color-mix(in srgb, var(--surface) 55%, transparent));
            box-shadow: 0 4px 16px color-mix(in srgb, var(--brand) 24%, transparent);
          }
          .connect-grid .connect-ico { width: 28px; height: 28px; }
          .connect-grid .connect-link:active { transform: scale(.93); box-shadow: 0 2px 8px color-mix(in srgb, var(--brand) 30%, transparent); }
          .connect-grid .connect-link:hover { transform: none; }
          /* bigger, more tappable toolbar buttons */
          .contact-issue .toolbar-btn { height: 34px; width: 34px; }
          /* bigger label pills for comfortable tapping */
          .contact-issue .label-pill { font-size: 12px !important; padding: 5px 11px; }
        }
      `}</style>
    </div>
  );
}
