import type { PropsWithChildren } from "react";

import { css } from "@/styled-system/css";

export const P5 = ({ children }: PropsWithChildren) => {
  return <span className={css({ color: "#08519c" })}>{children}</span>;
};

export const T7 = ({ children }: PropsWithChildren) => {
  return <span className={css({ color: "blue.500" })}>{children}</span>;
};

export const S5 = ({ children }: PropsWithChildren) => {
  return <span className={css({ color: "#6baed6" })}>{children}</span>;
};

export const P7 = ({ children }: PropsWithChildren) => {
  return <span className={css({ color: "#a50f15" })}>{children}</span>;
};

export const S7 = ({ children }: PropsWithChildren) => {
  return <span className={css({ color: "#fc9272" })}>{children}</span>;
};

export const Me = ({ children }: PropsWithChildren) => {
  return <span className={css({ color: "#969696" })}>{children}</span>;
};

interface SeqProps {
  fchain: JSX.Element;
  rchain: JSX.Element;
  annotation: JSX.Element;
}

export const Seq = ({ fchain, rchain, annotation }: SeqProps) => {
  return (
    <pre
      className={css({
        bg: "#fffff0",
        color: "#000000",
        overflowX: "auto",
        whiteSpace: "pre",
        overflowWrap: "normal",
        wordBreak: "normal",
      })}
    >
      <span>5&apos;- </span>
      {fchain} - 3&apos;
      <br />
      <span>3&apos;- </span>
      {rchain} - 5&apos;
      <br />
      <span></span>
      {annotation} <br />
    </pre>
  );
};
