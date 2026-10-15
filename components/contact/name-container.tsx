"use client";
import type { NextPage } from "next";
import React from "react";

type Props = {
  className?: string;
  titlePlaceholder?: string;
  placeholder?: string;
  typeSectionBorder?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: React.Ref<HTMLInputElement>;
  id?: string;
  required?: boolean;
  valueForRequired?: string;
  size?: "sm" | "md" | "lg";
};

const NameContainer: NextPage<Props> = ({
  className = "",
  titlePlaceholder = "",
  placeholder = "",
  typeSectionBorder,
  inputProps,
  inputRef,
  id,
  required = false,
  valueForRequired = "",
  size = "md",
}) => {
  const showReq = required && !valueForRequired.trim();

  const sizeCls =
    size === "sm"
      ? "h-10 rounded-xl px-4"
      : size === "lg"
      ? "h-14 rounded-2xl px-7"
      : "h-12 rounded-2xl px-6";

  return (
    <div className={["flex min-w-0 flex-col gap-2 w-full", className].join(" ")}>
      {!!titlePlaceholder && (
        <label
          htmlFor={id}
          className="relative inline-flex items-center gap-2 cursor-pointer select-none"
        >
          <b className="relative">{titlePlaceholder}</b>
          {showReq && (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="w-3 h-3 text-gray-400"
            >
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.2" fill="currentColor" />
            </svg>
          )}
        </label>
      )}

      <div className="relative min-w-0">
        <input
          ref={inputRef}
          id={id}
          {...inputProps}
          required={required}
          className={[
            "contact-input relative border-[2px] bg-transparent",
            "w-full min-w-0 box-border [outline:none]",
            "transition-all duration-300",
            "font-urbanist font-bold text-lg text-[var(--fg)] placeholder:text-gray-400",
            sizeCls,
            inputProps?.className || "",
          ].join(" ")}
          placeholder={placeholder}
          style={typeSectionBorder ? { border: typeSectionBorder } : undefined}
        />
      </div>
    </div>
  );
};

export default NameContainer;
