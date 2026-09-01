"use client";

import type { ChangeEvent } from "react";
import styles from "./code-editor.module.css";

export type CodeEditorProps = {
  id?: string;
  value: string;
  placeholder?: string;
  "aria-label": string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export default function CodeEditor({
  id,
  value,
  placeholder,
  "aria-label": ariaLabel,
  onChange,
}: CodeEditorProps) {
  return (
    <div className={styles.root}>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        spellCheck={false}
        wrap="off"
        onChange={onChange}
      />
    </div>
  );
}
