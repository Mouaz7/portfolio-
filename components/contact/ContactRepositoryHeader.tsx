"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

const tabs = [
  { key: "repoCode", icon: "code" },
  { key: "repoIssues", icon: "issue" },
  { key: "repoPullRequests", icon: "branch" },
  { key: "repoActions", icon: "action" },
  { key: "repoContact", icon: "contact", active: true },
] as const;

function RepositoryMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24">
      <path d="M4.75 3.75A1.75 1.75 0 0 1 6.5 2h10.75A1.75 1.75 0 0 1 19 3.75v16.5a.75.75 0 0 1-1.2.6L15 18.75l-2.8 2.1a.75.75 0 0 1-.9 0l-2.8-2.1-2.8 2.1a.75.75 0 0 1-1.2-.6V3.75Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6.5h7.5M8 10h7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TabIcon({ kind }: { kind: (typeof tabs)[number]["icon"] }) {
  if (kind === "code") {
    return <svg aria-hidden viewBox="0 0 16 16"><path d="m6 4-4 4 4 4M10 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (kind === "issue") {
    return <svg aria-hidden viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8 5.2v3.3M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
  }
  if (kind === "branch") {
    return <svg aria-hidden viewBox="0 0 16 16"><circle cx="4" cy="3" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="4" cy="13" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M4 4.5v7M5.5 8h2A4.5 4.5 0 0 0 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
  }
  if (kind === "action") {
    return <svg aria-hidden viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="m7 5.4 3.4 2.6L7 10.6V5.4Z" fill="currentColor" /></svg>;
  }
  return <svg aria-hidden viewBox="0 0 16 16"><path d="M2.5 3.5h11v7h-7L3 13v-2.5h-.5v-7Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
}

export default function ContactRepositoryHeader() {
  const { dictionary } = useI18n();
  const copy = dictionary.contact;

  return (
    <header className="contact-repository-header" aria-label={copy.repository}>
      <div className="contact-repository-title-row">
        <div className="contact-repository-title">
          <span className="contact-repository-mark"><RepositoryMark /></span>
          <span className="contact-repository-owner">Mouaz7</span>
          <span aria-hidden className="contact-repository-slash">/</span>
          <strong>{copy.repositoryName}</strong>
          <span className="contact-repository-visibility">{copy.publicRepository}</span>
        </div>

        <div className="contact-repository-state" aria-label={copy.gitStatus}>
          <span className="contact-repository-state-dot" aria-hidden />
          <code>{copy.branch}</code>
          <span>{copy.gitStatus}</span>
        </div>
      </div>

      <div className="contact-repository-tabs" role="list" aria-label={copy.repository}>
        {tabs.map((tab) => (
          <span
            key={tab.key}
            className="contact-repository-tab"
            data-active={("active" in tab && tab.active) ? "true" : undefined}
            role="listitem"
          >
            <TabIcon kind={tab.icon} />
            {copy[tab.key]}
            {tab.key === "repoIssues" && <small>0</small>}
          </span>
        ))}
      </div>
    </header>
  );
}
