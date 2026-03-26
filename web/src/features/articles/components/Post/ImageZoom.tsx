"use client";

import { css } from "@/styled-system/css";
import { useCallback, useEffect, useState } from "react";

const overlayStyle = css({
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bg: "rgba(0, 0, 0, 0.8)",
  cursor: "zoom-out",
  animation: "fadeIn 0.2s ease-out",
});

const zoomedImageStyle = css({
  maxWidth: "90vw",
  maxHeight: "90vh",
  objectFit: "contain",
  rounded: "lg",
  animation: "scaleIn 0.2s ease-out",
});

const thumbnailStyle = css({
  cursor: "zoom-in",
});

export function ImageZoom(props: React.ComponentProps<"img">) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyboardHandler: zoom is supplementary */}
      <img
        {...props}
        onClick={open}
        className={thumbnailStyle}
        alt={props.alt ?? ""}
      />
      {isOpen && (
        // biome-ignore lint/a11y/useKeyboardHandler: handled via useEffect
        <div className={overlayStyle} onClick={close}>
          <img
            src={props.src}
            alt={props.alt ?? ""}
            className={zoomedImageStyle}
          />
        </div>
      )}
    </>
  );
}
