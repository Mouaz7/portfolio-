"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

type LoadingAnimationProps = {
  text: string;
  noun?: string;
};

export default function LoadingAnimation({ text, noun }: LoadingAnimationProps) {
  const { dictionary, format } = useI18n();
  const resourceName =
    noun?.trim() || text
      .replace(/loading\s*/i, "")
      .replace(/\.+$/, "")
      .trim() || "data";

  return (
    <div className="grid h-full w-full place-items-center px-4">
      <span className="sr-only" role="status" aria-live="polite">
        {text}
      </span>

      <div className="la-window" aria-hidden="true">
        <div className="la-hairline" />
        <div className="la-titlebar">
          <span className="la-dot la-dot-red" />
          <span className="la-dot la-dot-yellow" />
          <span className="la-dot la-dot-green" />
          <span className="la-path">~/portfolio - zsh</span>
        </div>

        <div className="la-body">
          <div>
            <span className="la-accent">$</span> git pull origin <span className="la-accent">{resourceName}</span>
          </div>
          <div className="la-progress-copy">
            <span className="la-spinner" />
            {format(dictionary.common.receiving, { name: resourceName })}
          </div>
          <div className="la-track">
            <span className="la-progress" />
          </div>
          <div className="la-status">
            {text}<span className="la-dots" /><span className="la-caret" />
          </div>
        </div>
      </div>
    </div>
  );
}
