import { apply, tw } from "@twind/core";
import { useRouter } from "next/router";
import Script from "next/script";
import React, { useEffect } from "react";

export default function Adsense({ className }: { className?: string }) {
  const { asPath } = useRouter();
  const props = process.env.NEXT_PUBLIC_IS_LOCALHOST
    ? {
      "data-adtest": "on",
    }
    : {};

  useEffect(() => {
    // @ts-ignore
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }, [asPath]);

  return (
    <div className={className} key={asPath}>
      <ins
        className={tw(apply("adsbygoogle block text-center"))}
        data-ad-client="ca-pub-3483824909024831"
        data-ad-slot="9343059166"
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...props}
      >
      </ins>
    </div>
  );
}
