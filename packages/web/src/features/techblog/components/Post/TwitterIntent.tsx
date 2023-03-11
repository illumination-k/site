import { forwardRef } from "react";

type TwitterIntentProps = {
  text?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
  related?: string[];
  in_reply_to?: string;
} & Omit<JSX.IntrinsicElements["a"], "href" | "target" | "rel">;

export const TwitterIntent = forwardRef<HTMLAnchorElement, TwitterIntentProps>(
  function TwitterIntent({ text, url, hashtags, via, related, in_reply_to, ...props }, ref) {
    const href = new URL("https://twitter.com/intent/tweet");

    const setSearchParams = (key: string, params: string | string[] | undefined) => {
      if (!params) return;

      if (typeof params === "string") {
        href.searchParams.set(key, params);
      } else {
        href.searchParams.set(key, params.join(","));
      }
    };

    setSearchParams("text", text);
    setSearchParams("url", url);
    setSearchParams("hashtags", hashtags);
    setSearchParams("via", via);
    setSearchParams("related", related);
    setSearchParams("in_reply_to", in_reply_to);

    return (
      <a
        ref={ref}
        target="_blank"
        href={href.toString()}
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
);
