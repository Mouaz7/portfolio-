import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import wasm from "shiki/wasm";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import c from "@shikijs/langs/c";
import cpp from "@shikijs/langs/cpp";
import css from "@shikijs/langs/css";
import html from "@shikijs/langs/html";
import java from "@shikijs/langs/java";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsx from "@shikijs/langs/jsx";
import markdown from "@shikijs/langs/markdown";
import php from "@shikijs/langs/php";
import python from "@shikijs/langs/python";
import rust from "@shikijs/langs/rust";
import shellscript from "@shikijs/langs/shellscript";
import sql from "@shikijs/langs/sql";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import yaml from "@shikijs/langs/yaml";

export type CodeReviewHighlighter = {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: "github-dark" | "github-light" },
  ) => { tokens: Array<Array<{ content: string; color?: string }>> };
};

let highlighterPromise: Promise<CodeReviewHighlighter> | null = null;

export function getCodeReviewHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    engine: createOnigurumaEngine(wasm),
    themes: [githubDark, githubLight],
    langs: [
      c,
      cpp,
      css,
      html,
      java,
      javascript,
      json,
      jsx,
      markdown,
      php,
      python,
      rust,
      shellscript,
      sql,
      tsx,
      typescript,
      yaml,
    ],
  }) as Promise<CodeReviewHighlighter>;

  return highlighterPromise;
}
