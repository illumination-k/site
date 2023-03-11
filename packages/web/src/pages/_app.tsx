import install from "@twind/with-next/app";
import type { AppProps } from "next/app";
import Script from "next/script";
import { useCallback, useEffect } from "react";

// @type-ignore
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
      <Component {...pageProps} />
    </>
  );
}

export default install(config, App);
