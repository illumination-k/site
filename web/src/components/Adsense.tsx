"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: { [key: string]: unknown }[];
  }
}

export default function Adsense({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      // @ts-ignore
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
