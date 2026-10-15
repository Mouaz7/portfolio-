"use client";

import type { ChangeEvent } from "react";
import styles from "./code-editor.module.css";

export type CodeEditorProps = {
  id?: string;
  value: string;
  placeholder?: string;
  "aria-label": string;
  "aria-describedby"?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export default function CodeEditor({
  id,
  value,
  placeholder,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  onChange,
}: CodeEditorProps) {
  return (
    <div className={styles.root}>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        placeholder={placeholder}
        spellCheck={false}
        wrap="off"
        onChange={onChange}
      />
    </div>
  );
}
