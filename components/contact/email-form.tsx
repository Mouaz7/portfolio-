"use client";
import type { NextPage } from "next";
import React, { useRef, useState } from "react";
import NameContainer from "@/components/contact/name-container";
import SendButton from "@/components/contact/SendButton";
import { isValidEmail, NAME_MAX, EMAIL_MAX, MESSAGE_MAX } from "@/lib/contact/validate";
import SocialIcon from "./SocialIcon";
import { useContactLinks } from "./use-contact-links";
import { useContactFiles } from "./use-contact-files";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { ContactSocialLink } from "@/lib/contact/social-links";

type SendPayload = {
  name: string;
  email: string;
  message: string;
  files: File[];
};

type Props = {
  className?: string;
  idPrefix?: string;
  onSend?: (payload: SendPayload) => Promise<boolean> | boolean;
  maxTotalMb?: number;
  showMobileIcons?: boolean;
  initialLinks?: ContactSocialLink[];
};

const FORM_WIDTH_CLASS =
  "w-full max-w-[520px] sm:max-w-[680px] min-[900px]:max-w-[760px] min-[1200px]:max-w-[820px]";

const FIELD_INPUT_CLASS =
  "max-[430px]:px-3 max-[430px]:text-base min-[900px]:h-12 min-[900px]:rounded-2xl min-[900px]:text-[19px]";

const MESSAGE_BOX_CLASS = [
  "contact-message-field relative border-[2px] rounded-2xl",
  "w-full min-w-0 box-border flex flex-col overflow-hidden",
  "transition-all duration-300",
].join(" ");

const MESSAGE_TEXTAREA_CLASS = [
  "w-full min-w-0 box-border resize-none bg-transparent border-0",
  "h-[150px] sm:h-[190px] min-[900px]:h-[208px] min-[1200px]:h-[224px]",
  "px-5 min-[900px]:px-6 pt-3.5 min-[900px]:pt-4 pb-3",
  "font-urbanist font-bold text-lg min-[900px]:text-[19px]",
  "text-[var(--fg)] placeholder:text-gray-400 [outline:none]",
].join(" ");

const FIELD_META_CLASS = [
  "contact-field-meta flex min-w-0 flex-1 flex-wrap justify-end",
  "gap-x-1.5 gap-y-0.5 text-[10px] min-[430px]:text-[11px]",
].join(" ");

const ATTACH_BUTTON_CLASS = [
  "contact-field-action inline-flex min-w-0 items-center gap-1.5",
  "text-[12px] min-[360px]:text-[13px] font-semibold",
  "hover:opacity-90 transition cursor-pointer",
].join(" ");

const MOBILE_ICON_CLASS =
  "h-5 w-5 min-[340px]:h-[22px] min-[340px]:w-[22px]";

const FILE_CHIP_CLASS = [
  "contact-file-chip flex items-center gap-1.5 rounded-md border border-steelblue/60",
  "bg-[var(--surface)]/80 px-2 py-1",
].join(" ");

const trimName = (v: string, max = 16) => {
  if (v.length <= max) return v;
  const head = Math.ceil((max - 1) * 0.6);
  const tail = (max - 1) - head;
  return v.slice(0, head) + "…" + v.slice(-tail);
};

const EmailForm: NextPage<Props> = ({
  className = "",
  idPrefix = "contact",
  onSend,
  maxTotalMb = 10,
  showMobileIcons = false,
  initialLinks,
}) => {
  const { dictionary, format } = useI18n();
  const copy = dictionary.contact;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const links = useContactLinks(showMobileIcons, initialLinks);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const { files, totalBytes, totalOk, addFiles, removeFile, clearFiles, fileKey } = useContactFiles(
    maxTotalMb,
    (selected) => format(copy.attachmentsTooLargeSelected, { size: maxTotalMb, selected }),
  );

  const stopSpaceBubble = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.code === "Space") e.stopPropagation();
  };

  function handleFilesChange(fileList: FileList | null) {
    setError(null);
    const fileError = addFiles(fileList);
    if (fileError) setError(fileError);
  }

  async function handleSendClick() {
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(copy.required);
      return;
    }
    if (!totalOk) {
      setError(
        format(copy.attachmentsTooLargeSelected, {
          size: maxTotalMb,
          selected: (totalBytes / (1024 * 1024)).toFixed(1),
        }),
      );
      return;
    }
    if (!isValidEmail(email)) {
      setError(copy.invalidEmail);
      return;
    }

    setStatus("sending");
    try {
      const ok = (await onSend?.({ name, email, message, files })) ?? false;
      if (ok) {
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
        clearFiles();
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("idle");
        setError(copy.sendFailed);
      }
    } catch {
      setStatus("idle");
      setError(copy.sendFailed);
    }
  }

  const messageLeft = Math.max(0, MESSAGE_MAX - message.length);
  const identityComplete = Boolean(name.trim() && isValidEmail(email));
  const messageComplete = Boolean(message.trim());
  const readyToCommit = identityComplete && messageComplete && totalOk;
  const hasChanges = Boolean(name.trim() || email.trim() || message.trim() || files.length > 0);
  return (
    <form
      aria-label={copy.form}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSendClick();
      }}
      className={[
        "contact-form w-full max-w-full min-w-0 box-border text-left font-urbanist",
        className,
      ].join(" ")}
      data-has-changes={hasChanges ? "true" : "false"}
    >
      <div className="contact-form-worktree">
        <section className="contact-commit-panel" aria-label={copy.openMessage}>
          <div className="contact-commit-toolbar">
            {showMobileIcons && (
              <span className="contact-mobile-repository-context">
                <svg aria-hidden viewBox="0 0 16 16"><path d="M3 2.25h7l3 3v8.5H3V2.25Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M10 2.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
                <span>Mouaz7</span>
                <i aria-hidden>/</i>
                <strong>{copy.repositoryName}</strong>
              </span>
            )}
            <span className="contact-branch-selector">
              <svg aria-hidden viewBox="0 0 16 16"><circle cx="4" cy="3" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="4" cy="13" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M4 4.5v7M5.5 8h2A4.5 4.5 0 0 0 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
              {copy.commitToBranch}
            </span>
            <span className="contact-toolbar-status"><i aria-hidden />{copy.gitStatus}</span>
          </div>

          <div className="contact-commit-body">
            <div className="contact-commit-heading">
              <div>
                <span className="contact-commit-kicker">{copy.kicker}</span>
                <h2>{copy.openMessage}</h2>
              </div>
              <span className="contact-new-badge">{copy.newMessage}</span>
            </div>

            <div className={`contact-form-fields ${FORM_WIDTH_CLASS}`}>
              <div className="contact-identity-grid">
                <NameContainer
                  id={`${idPrefix}-name`}
                  titlePlaceholder={copy.yourName}
                  placeholder={copy.name}
                  required
                  valueForRequired={name}
                  size="sm"
                  inputProps={{
                    value: name,
                    onChange: (e) => setName(e.currentTarget.value.slice(0, NAME_MAX)),
                    maxLength: NAME_MAX,
                    autoComplete: "name",
                    onKeyDown: stopSpaceBubble,
                    className: FIELD_INPUT_CLASS,
                  }}
                />
                <NameContainer
                  id={`${idPrefix}-email`}
                  titlePlaceholder={copy.yourEmail}
                  placeholder={copy.email}
                  required
                  valueForRequired={email}
                  size="sm"
                  inputProps={{
                    type: "email",
                    value: email,
                    onChange: (e) => setEmail(e.currentTarget.value.slice(0, EMAIL_MAX)),
                    maxLength: EMAIL_MAX,
                    inputMode: "email",
                    autoComplete: "email",
                    onKeyDown: stopSpaceBubble,
                    className: FIELD_INPUT_CLASS,
                  }}
                />
              </div>

              <div className="contact-message-control">
                <label htmlFor={`${idPrefix}-message`}>
                  <b>{copy.yourMessage}</b>
                  <span>{format(copy.messageCount, { count: messageLeft, max: MESSAGE_MAX })}</span>
                </label>

                <div className={MESSAGE_BOX_CLASS}>
                  <div className="contact-editor-tabs" role="tablist" aria-label={copy.yourMessage}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={editorMode === "write"}
                      aria-controls={`${idPrefix}-write-panel`}
                      id={`${idPrefix}-write-tab`}
                      onClick={() => setEditorMode("write")}
                    >
                      {copy.write}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={editorMode === "preview"}
                      aria-controls={`${idPrefix}-preview-panel`}
                      id={`${idPrefix}-preview-tab`}
                      onClick={() => setEditorMode("preview")}
                    >
                      {copy.preview}
                    </button>
                    <span className="contact-editor-language" aria-hidden>Markdown</span>
                  </div>

                  {editorMode === "write" ? (
                    <div id={`${idPrefix}-write-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-write-tab`}>
                      <textarea
                        id={`${idPrefix}-message`}
                        className={MESSAGE_TEXTAREA_CLASS}
                        placeholder={copy.message}
                        value={message}
                        maxLength={MESSAGE_MAX}
                        onChange={(e) => setMessage(e.currentTarget.value.slice(0, MESSAGE_MAX))}
                        onKeyDown={stopSpaceBubble}
                      />
                    </div>
                  ) : (
                    <div
                      id={`${idPrefix}-preview-panel`}
                      role="tabpanel"
                      aria-labelledby={`${idPrefix}-preview-tab`}
                      className="contact-message-preview"
                    >
                      {message.trim() ? <p>{message}</p> : <span>{copy.previewEmpty}</span>}
                    </div>
                  )}

                  <div className="contact-changed-files">
                    <div className="contact-changed-files-heading">
                      <span>
                        <svg aria-hidden viewBox="0 0 16 16"><path d="M3.5 1.75h6L12.5 4.8v9.45H3.5V1.75Z" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M9.5 1.9v3h2.8" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                        {copy.changedFiles}
                        {hasChanges && <small>{copy.fileChanged}</small>}
                      </span>
                      <strong>{files.length + (hasChanges ? 1 : 0)}</strong>
                    </div>

                    <div className="contact-tracked-file" data-modified={hasChanges ? "true" : undefined}>
                      <span aria-hidden>
                        {hasChanges ? "M" : (
                          <svg viewBox="0 0 16 16"><path d="M3 2.25h7l3 3v8.5H3V2.25Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /><path d="M10 2.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
                        )}
                      </span>
                      <code>contact.md</code>
                      <small>{hasChanges ? copy.contactModified : copy.workingTreeClean}</small>
                    </div>

                    {files.length === 0 ? (
                      <div className="contact-no-files"><span aria-hidden>∅</span>{copy.noFilesChanged}</div>
                    ) : (
                      <div className="contact-file-list">
                        {files.map((file) => {
                          const key = fileKey(file);
                          return (
                            <div key={key} className={FILE_CHIP_CLASS} title={file.name}>
                              <span className="contact-file-status">A</span>
                              <svg aria-hidden viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                              <span className="contact-file-name">{trimName(file.name, 24)}</span>
                              <span className="contact-field-meta">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                              <button type="button" onClick={() => removeFile(key)} aria-label={format(copy.removeFile, { name: file.name })} title={copy.remove}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="contact-attachment-toolbar">
                      <div>
                        <button type="button" onClick={() => inputFileRef.current?.click()} className={ATTACH_BUTTON_CLASS} title={copy.attachFiles}>
                          <svg aria-hidden viewBox="0 0 24 24"><path d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 114.95 4.95l-9.2 9.2a1.5 1.5 0 01-2.12-2.12l8.5-8.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          {copy.attachFiles}
                        </button>
                        <span className="contact-attachment-limit">{format(copy.max, { size: maxTotalMb })}</span>
                        <input ref={inputFileRef} type="file" name="attachments" aria-label={copy.attachments} multiple onChange={(e) => handleFilesChange(e.currentTarget.files)} accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" className="hidden" />
                      </div>
                      {files.length > 0 && <span className={FIELD_META_CLASS}>{format(copy.selectedSize, { size: (totalBytes / (1024 * 1024)).toFixed(2) })}</span>}
                    </div>
                  </div>
                </div>

                {!totalOk && <div className="contact-form-error">{format(copy.attachmentsTooLarge, { size: maxTotalMb })}</div>}
                {error && totalOk && <div role="alert" className="contact-form-error">{error}</div>}
              </div>
            </div>

            <div className="contact-commit-actions contact-mobile-actions">
              <div className="contact-mobile-send">
                <SendButton className="contact-send-button" gapPx={0} iconSize={18} type="submit" status={status} label={copy.commitAndSend} sentLabel={copy.sent} sendingLabel={copy.sending} />
              </div>

              {showMobileIcons && links.length > 0 && (
                <div className="contact-mobile-socials" style={{ WebkitOverflowScrolling: "touch" }}>
                  {links.map((link) => (
                    <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.title} title={link.title} className="contact-mobile-social-link">
                      <SocialIcon link={link} size={24} className={`${MOBILE_ICON_CLASS} select-none pointer-events-none`} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="contact-command-strip" aria-live="polite">
              <code>$ git status --short contact.md</code>
              <span data-ready={readyToCommit ? "true" : undefined}>{hasChanges ? copy.contactModified : copy.workingTreeClean}</span>
              <small>{readyToCommit ? copy.readyToCommit : copy.branch}</small>
            </div>
          </div>
        </section>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "sending" ? copy.sendingMessage : status === "sent" ? copy.messageSent : ""}
      </span>
    </form>
  );
};

export default EmailForm;
