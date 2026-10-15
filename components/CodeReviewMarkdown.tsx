"use client";

import { useEffect, useMemo, useState } from "react";
import { parseMarkdownBlocks, type MarkdownBlock } from "@/lib/ai/markdown";
import styles from "./code-review-markdown.module.css";

type HighlightLine = Array<{ content: string; color?: string }>;
type HighlightTheme = "github-dark" | "github-light";
type ShikiHighlighter = {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: HighlightTheme },
  ) => { tokens: HighlightLine[] };
};

const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "shellscript",
  c: "c",
  cpp: "cpp",
  css: "css",
  html: "html",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  php: "php",
  py: "python",
  python: "python",
  rust: "rust",
  sh: "shellscript",
  shell: "shellscript",
  sql: "sql",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  yaml: "yaml",
  yml: "yaml",
};

let highlighterPromise: Promise<ShikiHighlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("@/lib/ai/shiki-highlighter").then(({ getCodeReviewHighlighter }) =>
      getCodeReviewHighlighter() as Promise<ShikiHighlighter>,
    );
  }
  return highlighterPromise;
}

function languageForShiki(language: string) {
  return LANGUAGE_ALIASES[language.toLowerCase()] ?? "text";
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className={styles.inlineCode} key={`${part}-${index}`}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const [theme, setTheme] = useState<HighlightTheme>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("light")
      ? "github-light"
      : "github-dark",
  );
  const [lines, setLines] = useState<HighlightLine[] | null>(null);
  const shikiLanguage = languageForShiki(language);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setTheme(root.classList.contains("light") ? "github-light" : "github-dark");
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    setLines(null);
    getHighlighter()
      .then((highlighter) => highlighter.codeToTokens(code, { lang: shikiLanguage, theme }).tokens)
      .then((tokens) => {
        if (active) setLines(tokens);
      })
      .catch(() => {
        if (active) setLines([[{ content: code }]]);
      });

    return () => {
      active = false;
    };
  }, [code, shikiLanguage, theme]);

  const renderedLines: HighlightLine[] = lines ?? code.split("\n").map((line) => [{ content: line }]);

  return (
    <div className={styles.codeShell} data-language={language || "text"}>
      <div className={styles.codeToolbar}>
        <span>{language || "text"}</span>
        <button
          type="button"
          className={styles.copyButton}
          onClick={() => void navigator.clipboard?.writeText(code)}
        >
          Copy
        </button>
      </div>
      <pre className={styles.codeBlock} dir="ltr" aria-label={`${language || "text"} code`}>
        <code>
          {renderedLines.map((line, index) => (
            <span className={styles.codeLine} key={`line-${index}`}>
              <span className={styles.lineNumber}>{index + 1}</span>
              <span className={styles.lineContent}>
                {line.map((token, tokenIndex) => (
                  <span style={{ color: token.color }} key={`token-${index}-${tokenIndex}`}>
                    {token.content}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function renderBlock(block: MarkdownBlock, index: number) {
  if (block.type === "heading") {
    const Heading = `h${block.level}` as "h1" | "h2" | "h3";
    return <Heading key={`heading-${index}`}>{renderInline(block.text)}</Heading>;
  }

  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return (
      <List key={`list-${index}`}>
        {block.items.map((item, itemIndex) => (
          <li key={`item-${index}-${itemIndex}`}>{renderInline(item)}</li>
        ))}
      </List>
    );
  }

  if (block.type === "code") {
    return <HighlightedCode key={`code-${index}`} code={block.code} language={block.language} />;
  }

  return (
    <p key={`paragraph-${index}`}>
      {block.lines.map((line, lineIndex) => (
        <span key={`paragraph-line-${index}-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

export default function CodeReviewMarkdown({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);
  return <div className={styles.root}>{blocks.map(renderBlock)}</div>;
}
