import type { AppProps } from "next/app";
import Script from "next/script";

import install from "@twind/with-next/app";
import config from "../../twind.config";

const GA_TRACKING_ID = process.env.NODE_ENV === "development" ? "" : "G-5X44HTLX5D";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script async strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Script
        id="googleads-id"
        async
        strategy="lazyOnload"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3483824909024831"
        crossOrigin="anonymous"
      />
      <Component {...pageProps} />
    </>
  );
}

export default install(config, App);
