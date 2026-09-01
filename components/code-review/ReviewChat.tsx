"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BroomIcon } from "@phosphor-icons/react/dist/csr/Broom";
import { ChatCircleTextIcon } from "@phosphor-icons/react/dist/csr/ChatCircleText";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import CodeReviewMarkdown from "@/components/CodeReviewMarkdown";
import {
  languageDirection,
  resolveLanguage,
  type LanguagePreference,
  type ResolvedLanguage,
} from "@/lib/ai/language";
import { fetchWithTurnstile } from "@/lib/security/turnstile-client";
import styles from "./ReviewChat.module.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatTopic = "about" | "code";

export type ReviewChatContext = {
  mode: "assistant" | "review";
  code: string;
  codeLanguage: string;
  focus: "review" | "optimize" | "security";
  language: LanguagePreference;
  review: string;
};

export type ReviewChatCopy = {
  title: string;
  assistantContext: string;
  aboutContext: string;
  reviewContext: string;
  modeLabel: string;
  aboutMode: string;
  codeMode: string;
  clear: string;
  conversation: string;
  emptyTitle: string;
  emptyHelp: string;
  assistantEmptyTitle: string;
  assistantEmptyHelp: string;
  aboutEmptyTitle: string;
  aboutEmptyHelp: string;
  question: string;
  placeholder: string;
  aboutPlaceholder: string;
  inputHelp: string;
  send: string;
  thinking: string;
  requestFailed: string;
  requestTimedOut: string;
  suggestions: [string, string, string];
  assistantSuggestions: [string, string, string];
  aboutSuggestions: [string, string, string];
};

type Props = {
  context: ReviewChatContext;
  copy: ReviewChatCopy;
  className?: string;
};

export default function ReviewChat({ context, copy, className = "" }: Props) {
  const [topic, setTopic] = useState<ChatTopic>("code");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseLanguage, setResponseLanguage] = useState<ResolvedLanguage>(
    resolveLanguage(context.language, ""),
  );
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const contextKey = useMemo(
    () => context.mode === "review"
      ? `${context.mode}:${context.codeLanguage}:${context.focus}:${context.code}:${context.review}`
      : context.mode,
    [context.code, context.codeLanguage, context.focus, context.mode, context.review],
  );
  const emptyTitle = topic === "about"
    ? copy.aboutEmptyTitle
    : context.mode === "review" ? copy.emptyTitle : copy.assistantEmptyTitle;
  const emptyHelp = topic === "about"
    ? copy.aboutEmptyHelp
    : context.mode === "review" ? copy.emptyHelp : copy.assistantEmptyHelp;
  const suggestions = topic === "about"
    ? copy.aboutSuggestions
    : context.mode === "review" ? copy.suggestions : copy.assistantSuggestions;

  useEffect(() => {
    if (topic !== "code") return;
    setMessages([]);
    setInput("");
    setError(null);
    setResponseLanguage(resolveLanguage(context.language, ""));
  }, [context.language, contextKey, topic]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, loading, error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const history = messages.slice(-8);
    setLoading(true);
    setError(null);
    setInput("");
    setMessages((current) => [...current, { role: "user", content: message }]);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetchWithTurnstile(
        topic === "about" ? "/api/ai/cv-chat" : "/api/ai/code-review/chat",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(topic === "about"
          ? { message, history, language: context.language }
          : {
              message,
              history,
              language: context.language,
              code: context.code,
              codeLanguage: context.codeLanguage,
              focus: context.focus,
              review: context.review,
            }),
        },
        topic === "about" ? "cv_chat" : "code_review_chat",
      );

      if (!response.ok) throw new Error(copy.requestFailed);
      const payload = (await response.json()) as {
        answer?: string;
        language?: ResolvedLanguage;
      };
      if (!payload.answer?.trim()) throw new Error(copy.requestFailed);

      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.answer!.trim() },
      ]);
      setResponseLanguage(payload.language ?? resolveLanguage(context.language, message));
    } catch (requestError) {
      setMessages((current) => current.slice(0, -1));
      setInput(message);
      setError(
        requestError instanceof Error && requestError.name === "AbortError"
          ? copy.requestTimedOut
          : copy.requestFailed,
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  function clearChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }

  function selectTopic(nextTopic: ChatTopic) {
    if (nextTopic === topic || loading) return;
    setTopic(nextTopic);
    setMessages([]);
    setInput("");
    setError(null);
    setResponseLanguage(resolveLanguage(context.language, ""));
  }

  return (
    <section
      className={[styles.root, className].filter(Boolean).join(" ")}
      aria-label={copy.title}
      dir="auto"
    >
      <header className={styles.header}>
        <span className={styles.title}>
          <ChatCircleTextIcon aria-hidden="true" />
          {copy.title}
        </span>
        <span className={styles.contextBadge}>
          {topic === "about"
            ? copy.aboutContext
            : context.mode === "review" ? copy.reviewContext : copy.assistantContext}
        </span>
        {messages.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            aria-label={copy.clear}
            title={copy.clear}
            disabled={loading}
            onClick={clearChat}
          >
            <BroomIcon aria-hidden="true" />
          </button>
        )}
      </header>

      <div className={styles.modeSwitch} role="group" aria-label={copy.modeLabel}>
        <button
          type="button"
          aria-pressed={topic === "about"}
          data-active={topic === "about"}
          disabled={loading}
          onClick={() => selectTopic("about")}
        >
          {copy.aboutMode}
        </button>
        <button
          type="button"
          aria-pressed={topic === "code"}
          data-active={topic === "code"}
          disabled={loading}
          onClick={() => selectTopic("code")}
        >
          {copy.codeMode}
        </button>
      </div>

      <div
        ref={logRef}
        className={styles.log}
        role="log"
        aria-label={copy.conversation}
        aria-live="polite"
        aria-busy={loading}
        aria-relevant="additions text"
        dir={languageDirection(responseLanguage)}
      >
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <ChatCircleTextIcon aria-hidden="true" />
            <strong>{emptyTitle}</strong>
            <span>{emptyHelp}</span>
            <div className={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={styles.message}
              data-role={message.role}
              dir="auto"
            >
              {message.role === "assistant"
                ? <CodeReviewMarkdown markdown={message.content} />
                : message.content}
            </article>
          ))
        )}
        {loading && (
          <p className={styles.status} role="status">
            {copy.thinking}
            <span aria-hidden="true"><i /><i /><i /></span>
          </p>
        )}
        {error && (
          <div className={styles.error} role="alert">
            <WarningCircleIcon aria-hidden="true" />
            {error}
          </div>
        )}
      </div>

      <form className={styles.composer} onSubmit={submit}>
        <span id="review-chat-input-help" className={styles.srOnly}>{copy.inputHelp}</span>
        <textarea
          ref={inputRef}
          value={input}
          rows={1}
          maxLength={1200}
          dir="auto"
          aria-label={copy.question}
          aria-describedby="review-chat-input-help"
          placeholder={topic === "about" ? copy.aboutPlaceholder : copy.placeholder}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          <PaperPlaneTiltIcon aria-hidden="true" />
          <span>{loading ? copy.thinking : copy.send}</span>
        </button>
      </form>
    </section>
  );
}
