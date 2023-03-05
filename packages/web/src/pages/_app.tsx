import install from "@twind/with-next/app";
import type { AppProps } from "next/app";

// @type-ignore
import config from "../../twind.config";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default install(config, App);
