"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: { [key: string]: unknown }[];
  }
}

type AdsenseProps = {
  className?: string;
};

function BaseAdsense({ className }: AdsenseProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, [pathname, searchParams]);

  return (
    <div
      className={className}
      key={`${pathname.replace(/\//g, "-")}-${searchParams.toString()}`}
    >
      <ins
        className="adsbygoogle"
        data-ad-client="ca-pub-3483824909024831"
        data-ad-slot="9343059166"
        data-ad-format="auto"
        data-full-width-responsive="true"
      >
      </ins>
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
