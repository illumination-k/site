"use client";

import { type ComponentProps, useCallback, useRef, useState } from "react";

import { css } from "@/styled-system/css";

const copyButtonStyle = css({
  position: "absolute",
  top: 2,
  right: 2,
  px: 2,
  py: 1,
  rounded: "md",
  bg: "bg.elevated",
  color: "text.secondary",
  fontSize: "xs",
  cursor: "pointer",
  opacity: 0,
  transition: "opacity 0.2s",
  borderWidth: 1,
  borderColor: "border.default",
  _hover: { bg: "bg.surface", color: "text.primary" },
});

const wrapperStyle = css({
  position: "relative",
  _hover: {
    "& > button": {
      opacity: 1,
    },
  },
});

export function CodeBlock(props: ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const code = preRef.current?.querySelector("code");
    if (!code) return;
    const text = code.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className={wrapperStyle}>
      <pre ref={preRef} {...props} />
      <button type="button" className={copyButtonStyle} onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
