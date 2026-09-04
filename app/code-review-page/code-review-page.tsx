"use client";

import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChatCircleTextIcon } from "@phosphor-icons/react/dist/csr/ChatCircleText";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CodeIcon } from "@phosphor-icons/react/dist/csr/Code";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { TranslateIcon } from "@phosphor-icons/react/dist/csr/Translate";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import Header from "@/components/navigation/Header";
import CodeEditor from "@/components/CodeEditor";
import CodeReviewMarkdown from "@/components/CodeReviewMarkdown";
import type {
  ReviewChatContext,
  ReviewChatCopy,
} from "@/components/code-review/ReviewChat";
import PageLoadingStage from "@/components/ui/PageLoadingStage";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import {
  languageDirection,
  resolveLanguage,
  type LanguagePreference,
} from "@/lib/ai/language";
import { parseReviewResponse, type ReviewResponse } from "@/lib/ai/review-parser";
import { fetchWithTurnstile } from "@/lib/security/turnstile-client";
import styles from "../code-review-page.module.css";
import { useI18n } from "@/components/i18n/I18nProvider";

type ReviewFocus = "review" | "optimize" | "security";
type MobilePane = "editor" | "result" | "chat";

const ReviewChat = dynamic(() => import("@/components/code-review/ReviewChat"), {
  ssr: false,
});

const CODE_LANGUAGES = [
  ["typescript", "TypeScript"],
  ["javascript", "JavaScript"],
  ["python", "Python"],
  ["java", "Java"],
  ["csharp", "C#"],
  ["cpp", "C++"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["sql", "SQL"],
  ["json", "JSON"],
  ["shellscript", "Shell"],
  ["rust", "Rust"],
] as const;

const REVIEW_FOCUSES: ReviewFocus[] = ["review", "optimize", "security"];

function openListbox(
  setOpen: (open: boolean) => void,
  setFocusTarget: (optionId: string) => void,
  optionId: string,
) {
  setFocusTarget(optionId);
  setOpen(true);
}

function handleOptionKey(
  event: React.KeyboardEvent<HTMLButtonElement>,
  close: () => void,
  triggerId: string,
) {
  const options = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
  );
  const index = options.indexOf(event.currentTarget);
  let next = index;
  if (event.key === "ArrowDown") next = (index + 1) % options.length;
  else if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = options.length - 1;
  else if (event.key === "Escape") {
    event.preventDefault();
    close();
    document.getElementById(triggerId)?.focus();
    return;
  } else return;
  event.preventDefault();
  options[next]?.focus();
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return String(body.error ?? fallback);
  } catch {
    return fallback;
  }
}

export default function CodeReviewPage() {
  const { dictionary, format } = useI18n();
  const copy = dictionary.codeReview;
  const [listboxFocusTarget, setListboxFocusTarget] = useState<string | null>(null);
  const languageLabels: Record<LanguagePreference, string> = {
    auto: dictionary.common.auto,
    sv: dictionary.common.languages.sv,
    en: dictionary.common.languages.en,
    ar: dictionary.common.languages.ar,
  };

  useEffect(() => {
    if (!listboxFocusTarget) return;

    const option = document.getElementById(listboxFocusTarget);
    if (!option) return;

    option.focus();
    setListboxFocusTarget(null);
  }, [listboxFocusTarget]);
  const { loading: pageLoading, finishLoading } = useMinimumLoading(400);
  const [mobilePane, setMobilePane] = useState<MobilePane>("editor");
  const [language, setLanguage] = useState<LanguagePreference>("auto");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [codeLanguageOpen, setCodeLanguageOpen] = useState(false);
  const [focus, setFocus] = useState<ReviewFocus>("review");
  const [reviewResult, setReviewResult] = useState<ReviewResponse | null>(null);
  const [reviewContext, setReviewContext] = useState<ReviewChatContext | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    finishLoading();
  }, [finishLoading]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);
    setChatOpen(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetchWithTurnstile("/api/ai/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ code, codeLanguage, focus, language }),
      }, "code_review");

      if (!response.ok) throw new Error(await readApiError(response, copy.requestFailed));
      const payload: unknown = await response.json();
      const parsedReview = parseReviewResponse(
        payload,
        { language: resolveLanguage(language, code), model: "AI" },
        codeLanguage,
      );
      setReviewResult(parsedReview);
      setReviewContext({
        mode: "review",
        code,
        codeLanguage,
        focus,
        language: parsedReview.language,
        review: parsedReview.review,
      });
      setMobilePane("result");
    } catch (requestError) {
      setError(
        requestError instanceof Error && requestError.name === "AbortError"
          ? copy.reviewTimedOut
          : requestError instanceof Error
            ? requestError.message
            : copy.reviewFailed,
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  const resultLanguage = reviewResult?.language ?? resolveLanguage(language, code);
  const chatContext: ReviewChatContext = reviewContext ?? {
    mode: "assistant",
    code,
    codeLanguage,
    focus,
    language,
    review: "",
  };
  const mobilePanes: MobilePane[] = ["editor", "result", "chat"];
  const reviewChatCopy: ReviewChatCopy = {
    title: copy.reviewChatTitle,
    assistantContext: copy.codeAssistantContext,
    aboutContext: copy.aboutMouazContext,
    reviewContext: copy.reviewChatContext,
    modeLabel: copy.chatModeLabel,
    aboutMode: copy.aboutMouazMode,
    codeMode: copy.codeHelpMode,
    clear: copy.reviewChatClear,
    conversation: copy.reviewChatConversation,
    emptyTitle: copy.reviewChatEmptyTitle,
    emptyHelp: copy.reviewChatEmptyHelp,
    assistantEmptyTitle: copy.codeAssistantEmptyTitle,
    assistantEmptyHelp: copy.codeAssistantEmptyHelp,
    aboutEmptyTitle: copy.aboutMouazEmptyTitle,
    aboutEmptyHelp: copy.aboutMouazEmptyHelp,
    question: copy.reviewChatQuestion,
    placeholder: copy.reviewChatPlaceholder,
    aboutPlaceholder: copy.aboutMouazPlaceholder,
    inputHelp: copy.reviewChatInputHelp,
    send: copy.reviewChatSend,
    thinking: copy.reviewChatThinking,
    requestFailed: copy.reviewChatFailed,
    requestTimedOut: copy.reviewChatTimedOut,
    suggestions: [
      copy.reviewChatSuggestions.explain,
      copy.reviewChatSuggestions.fix,
      copy.reviewChatSuggestions.tests,
    ],
    assistantSuggestions: [
      copy.codeAssistantSuggestions.explain,
      copy.codeAssistantSuggestions.generate,
      copy.codeAssistantSuggestions.debug,
    ],
    aboutSuggestions: [
      copy.aboutMouazSuggestions.experience,
      copy.aboutMouazSuggestions.projects,
      copy.aboutMouazSuggestions.contact,
    ],
  };

  function handleMobilePaneKey(
    event: React.KeyboardEvent<HTMLButtonElement>,
    pane: MobilePane,
  ) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = mobilePanes.indexOf(pane);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = mobilePanes.length - 1;
    else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % mobilePanes.length;
    else nextIndex = (currentIndex - 1 + mobilePanes.length) % mobilePanes.length;
    const nextPane = mobilePanes[nextIndex];
    setMobilePane(nextPane);
    document.getElementById(`${nextPane}-tab`)?.focus();
  }

  return (
    <div className={styles.root} data-page="code-review">
      <Header />
      <main className={styles.main}>
        {pageLoading ? (
          <PageLoadingStage text={copy.loading} noun={copy.title} />
        ) : (
          <div className={styles.shell} data-code-review-shell>
          <div className={styles.toolbar}>
            <div className={styles.pageTitle}>
              <CodeIcon aria-hidden="true" />
              <span>{copy.title}</span>
            </div>
            <div
              className={styles.languageControl}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setLanguageOpen(false);
              }}
            >
              <TranslateIcon aria-hidden="true" />
              <span className={styles.srOnly}>{copy.responseLanguage}</span>
              <button
                id="response-language-button"
                type="button"
                className={styles.selectButton}
                aria-label={format(copy.response, { language: languageLabels[language] })}
                aria-haspopup="listbox"
                aria-expanded={languageOpen}
                aria-controls="response-language-listbox"
                onKeyDown={(event) => {
                  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                    event.preventDefault();
                    openListbox(
                      setLanguageOpen,
                      setListboxFocusTarget,
                      `response-language-${language}`,
                    );
                  }
                }}
                onClick={() => setLanguageOpen((current) => !current)}
              >
                <span>{format(copy.response, { language: languageLabels[language] })}</span>
                <CaretDownIcon aria-hidden="true" />
              </button>
              {languageOpen && (
                <div
                  id="response-language-listbox"
                  className={styles.selectMenu}
                  role="listbox"
                  aria-label={copy.responseLanguageOptions}
                  aria-activedescendant={`response-language-${language}`}
                >
                  {(Object.keys(languageLabels) as LanguagePreference[]).map((value) => (
                    <button
                      id={`response-language-${value}`}
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={language === value}
                      className={styles.selectOption}
                      data-active={language === value}
                      onKeyDown={(event) => handleOptionKey(event, () => setLanguageOpen(false), "response-language-button")}
                      onClick={() => {
                        setLanguage(value);
                        setLanguageOpen(false);
                        document.getElementById("response-language-button")?.focus();
                      }}
                    >
                      {languageLabels[value]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <section className={styles.intro} aria-labelledby="code-review-intro-title">
            <div className={styles.introCopy} dir="auto">
              <span className={styles.introEyebrow}>{copy.eyebrow}</span>
              <h1 id="code-review-intro-title">{copy.heading}</h1>
              <p>{copy.description}</p>
              <ol className={styles.introSteps} aria-label={copy.howItWorks}>
                <li>
                  <span>1</span>
                  {copy.pasteCode}
                </li>
                <li>
                  <span>2</span>
                  {copy.chooseFocus}
                </li>
                <li>
                  <span>3</span>
                  {copy.getFeedback}
                </li>
              </ol>
            </div>
            <span className={styles.introStatus}>{copy.noStorage}</span>
          </section>

          <section className={styles.workspace} aria-label={copy.workspace}>
            <div className={styles.mobilePaneTabs} role="tablist" aria-label={copy.view}>
              <button
                id="editor-tab"
                type="button"
                role="tab"
                aria-selected={mobilePane === "editor"}
                aria-controls="editor-panel"
                tabIndex={mobilePane === "editor" ? 0 : -1}
                data-active={mobilePane === "editor"}
                onClick={() => setMobilePane("editor")}
                onKeyDown={(event) => handleMobilePaneKey(event, "editor")}
              >
                {copy.editor}
              </button>
              <button
                id="result-tab"
                type="button"
                role="tab"
                aria-selected={mobilePane === "result"}
                aria-controls="result-panel"
                tabIndex={mobilePane === "result" ? 0 : -1}
                data-active={mobilePane === "result"}
                onClick={() => setMobilePane("result")}
                onKeyDown={(event) => handleMobilePaneKey(event, "result")}
              >
                {copy.result}
              </button>
              <button
                id="chat-tab"
                type="button"
                role="tab"
                aria-selected={mobilePane === "chat"}
                aria-controls="result-panel"
                tabIndex={mobilePane === "chat" ? 0 : -1}
                data-active={mobilePane === "chat"}
                onClick={() => setMobilePane("chat")}
                onKeyDown={(event) => handleMobilePaneKey(event, "chat")}
              >
                {copy.chat}
              </button>
            </div>

            <div
              id="editor-panel"
              role="tabpanel"
              aria-labelledby="editor-tab"
              className={styles.panel}
              data-mobile-pane="editor"
              data-mobile-active={mobilePane === "editor"}
            >
              <form onSubmit={submitReview} style={{ display: "contents" }}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <span className={styles.trafficLights} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <CodeIcon aria-hidden="true" />
                  {copy.title}
                </div>
                <small>{code.length}/12000</small>
              </div>

              <CodeEditor
                id="code-review-editor"
                value={code}
                aria-label={copy.snippet}
                placeholder={copy.placeholder}
                onChange={(event) => setCode(event.target.value)}
              />

              <div className={styles.controls}>
                <div
                  className={styles.selectControl}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setCodeLanguageOpen(false);
                  }}
                >
                  <span className={styles.srOnly}>{copy.codeLanguage}</span>
                  <button
                    id="code-language-button"
                    type="button"
                    className={styles.selectButton}
                    aria-label={copy.codeLanguage}
                    aria-haspopup="listbox"
                    aria-expanded={codeLanguageOpen}
                    aria-controls="code-language-listbox"
                    onKeyDown={(event) => {
                      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                        event.preventDefault();
                        openListbox(
                          setCodeLanguageOpen,
                          setListboxFocusTarget,
                          `code-language-${codeLanguage}`,
                        );
                      }
                    }}
                    onClick={() => setCodeLanguageOpen((current) => !current)}
                  >
                    <span>{CODE_LANGUAGES.find(([value]) => value === codeLanguage)?.[1] ?? codeLanguage}</span>
                    <CaretDownIcon aria-hidden="true" />
                  </button>
                  {codeLanguageOpen && (
                    <div
                      id="code-language-listbox"
                      className={styles.selectMenu}
                      role="listbox"
                      aria-label={copy.codeLanguageOptions}
                      aria-activedescendant={`code-language-${codeLanguage}`}
                    >
                      {CODE_LANGUAGES.map(([value, label]) => (
                        <button
                          id={`code-language-${value}`}
                          key={value}
                          type="button"
                          role="option"
                          aria-selected={codeLanguage === value}
                          className={styles.selectOption}
                          data-active={codeLanguage === value}
                          onKeyDown={(event) => handleOptionKey(event, () => setCodeLanguageOpen(false), "code-language-button")}
                          onClick={() => {
                            setCodeLanguage(value);
                            setCodeLanguageOpen(false);
                            document.getElementById("code-language-button")?.focus();
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.focusGroup} aria-label={copy.reviewFocus}>
                  {REVIEW_FOCUSES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={styles.focusButton}
                      data-active={focus === item}
                      aria-pressed={focus === item}
                      onClick={() => setFocus(item)}
                    >
                      {copy.focus[item]}
                    </button>
                  ))}
                </div>
                <button type="submit" className={styles.primaryButton} disabled={loading || !code.trim()}>
                  <PaperPlaneTiltIcon aria-hidden="true" />
                  {loading ? copy.reviewing : copy.run}
                </button>
              </div>
              {error && (
                <div className={styles.errorBox} role="alert">
                  <WarningCircleIcon aria-hidden="true" />
                  {error}
                </div>
              )}
              </form>
            </div>

            <section
              id="result-panel"
              role="tabpanel"
              aria-labelledby={mobilePane === "chat" ? "chat-tab" : "result-tab"}
              className={[styles.panel, styles.resultPanel].join(" ")}
              data-mobile-pane="result"
              data-mobile-active={mobilePane !== "editor"}
              data-mobile-view={mobilePane}
              data-chat-open={chatOpen}
              aria-label={copy.resultLabel}
              dir="auto"
            >
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <span className={styles.trafficLights} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <ChatCircleTextIcon aria-hidden="true" />
                  {copy.reviewResult}
                </div>
                <div className={styles.panelHeaderActions}>
                  <small>{reviewResult?.model ?? "AI"}</small>
                  <button
                    type="button"
                    className={styles.chatToggle}
                    aria-controls="review-chat-panel"
                    aria-expanded={chatOpen}
                    data-active={chatOpen}
                    onClick={() => setChatOpen((current) => !current)}
                  >
                    <ChatCircleTextIcon aria-hidden="true" />
                    {chatOpen ? copy.closeReviewChat : copy.openCodeAssistant}
                  </button>
                </div>
              </div>
              <div className={styles.resultWorkspace}>
                <div
                  className={styles.resultBody}
                  aria-live="polite"
                  aria-busy={loading}
                  dir={reviewResult ? languageDirection(resultLanguage) : "auto"}
                >
                  {loading ? (
                    <p className={styles.emptyState} role="status">
                      {copy.reviewingCode}
                    </p>
                  ) : reviewResult ? (
                    <CodeReviewMarkdown markdown={reviewResult.review} />
                  ) : (
                    <div className={styles.emptyState}>
                      <ChatCircleTextIcon aria-hidden="true" />
                      <strong>{copy.ready}</strong>
                      <span>{copy.readyHelp}</span>
                    </div>
                  )}
                </div>
                <div
                  id="review-chat-panel"
                  className={styles.reviewChatSlot}
                  aria-hidden={!chatOpen && mobilePane !== "chat"}
                >
                  <ReviewChat context={chatContext} copy={reviewChatCopy} />
                </div>
              </div>
            </section>
          </section>
          </div>
        )}
      </main>
    </div>
  );
}
