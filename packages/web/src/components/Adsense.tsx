import { apply, tw } from "@twind/core";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

export default function Adsense({ className }: { className?: string }) {
  const { asPath } = useRouter();
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_LOCALHOST) {
      return;
    }

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, [asPath]);

  return (
    <div key={asPath} className={className}>
      {process.env.NEXT_PUBLIC_IS_LOCALHOST
        ? (
          <div className="bg-blue-100 w-full h-48 block flex items-center justify-center">
            <p className="text-8xl">Adsense!</p>
          </div>
        )
        : (
          <ins
            className={tw(apply("adsbygoogle block text-center"))}
            data-ad-client="ca-pub-3483824909024831"
            data-ad-slot="9343059166"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
    </div>
  );
}
