import Script from "next/script";

const PUBLISHER_ID = "ca-pub-3483824909024831";

export default function GoogleAdsenseScript() {
  return (
    <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
    />
  );
}
