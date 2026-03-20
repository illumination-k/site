"use client";

import { useCallback, useSyncExternalStore } from "react";

import { css } from "@/styled-system/css";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

type ColorMode = "light" | "dark";

function getColorMode(): ColorMode {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-color-mode");
  return attr === "dark" ? "dark" : "light";
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-color-mode"],
  });
  return () => observer.disconnect();
}

export default function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getColorMode, () => "light");

  const toggle = useCallback(() => {
    const next: ColorMode = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-color-mode", next);
    localStorage.setItem("color-mode", next);
  }, [mode]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        mode === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"
      }
      className={css({
        color: "text.secondary",
        transition: "colors",
        transitionDuration: "fast",
        _hover: { color: "accent.primary" },
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      })}
    >
      {mode === "dark" ? (
        <SunIcon className={css({ h: 6, w: 6 })} />
      ) : (
        <MoonIcon className={css({ h: 6, w: 6 })} />
      )}
    </button>
  );
}
