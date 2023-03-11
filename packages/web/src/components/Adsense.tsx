import { apply, tw } from "@twind/core";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

export default function Adsense({ className }: { className?: string }) {
  const { asPath } = useRouter();

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, [asPath]);

  return (
    <div key={asPath} className={className}>
      <ins
        className={tw(apply("adsbygoogle block text-center", className))}
        data-ad-client="ca-pub-3483824909024831"
        data-ad-slot="9343059166"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
