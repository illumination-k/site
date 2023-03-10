import { forwardRef, HTMLAttributes } from "react";

import * as React from "react";
import { SVGProps } from "react";

export const TwitterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 400"
    xmlSpace="preserve"
    {...props}
  >
    <path
      d="M400 200c0 110.5-89.5 200-200 200S0 310.5 0 200 89.5 0 200 0s200 89.5 200 200zM163.4 305.5c88.7 0 137.2-73.5 137.2-137.2 0-2.1 0-4.2-.1-6.2 9.4-6.8 17.6-15.3 24.1-25-8.6 3.8-17.9 6.4-27.7 7.6 10-6 17.6-15.4 21.2-26.7-9.3 5.5-19.6 9.5-30.6 11.7-8.8-9.4-21.3-15.2-35.2-15.2-26.6 0-48.2 21.6-48.2 48.2 0 3.8.4 7.5 1.3 11-40.1-2-75.6-21.2-99.4-50.4-4.1 7.1-6.5 15.4-6.5 24.2 0 16.7 8.5 31.5 21.5 40.1-7.9-.2-15.3-2.4-21.8-6v.6c0 23.4 16.6 42.8 38.7 47.3-4 1.1-8.3 1.7-12.7 1.7-3.1 0-6.1-.3-9.1-.9 6.1 19.2 23.9 33.1 45 33.5-16.5 12.9-37.3 20.6-59.9 20.6-3.9 0-7.7-.2-11.5-.7 21.1 13.8 46.5 21.8 73.7 21.8"
      className="fill-blue-400"
    />
  </svg>
);

type TwitterIntentProps = {
  text?: string;
  url?: string;
  hashtags?: string[];
  via?: string;
  related?: string[];
  in_reply_to?: string;
} & Omit<JSX.IntrinsicElements["a"], "href" | "target" | "rel">;

export const TwetterIntent = forwardRef<HTMLAnchorElement, TwitterIntentProps>(
  function TwetterIntent({ text, url, hashtags, via, related, in_reply_to, ...props }, ref) {
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
