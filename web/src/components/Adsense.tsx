"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";

import { css, cx } from "@/styled-system/css";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdsenseProps {
  className?: string;
}

function BaseAdsense({ className }: AdsenseProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      if (process.env.NODE_ENV === "development") {
        return;
      }
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, [pathname, searchParams]);

  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return (
    <div
      className={cx(
        css({
          minWidth: "10/12",
        }),
        className,
      )}
      key={`${pathname.replace(/\//g, "-")}-${searchParams.toString()}`}
    >
      <ins
        className={cx(css({ display: "block" }), "adsbygoogle")}
        data-ad-client="ca-pub-3483824909024831"
        data-ad-slot="9343059166"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

export default function Adsense(props: AdsenseProps) {
  return (
    <Suspense fallback={null}>
      <BaseAdsense {...props} />
    </Suspense>
  );
}
