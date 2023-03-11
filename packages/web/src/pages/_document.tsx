import install from "@twind/with-next/document";
import NextDocument, { Head, Html, Main, NextScript } from "next/document";

class Document extends NextDocument {
  render() {
    return (
      <Html lang="ja">
        <Head>
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
            data-ad-client="ca-pub-3483824909024831"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
export default install(Document);
