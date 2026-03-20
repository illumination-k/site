import Link from "next/link";

import { css } from "@/styled-system/css";

import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div
      className={css({
        h: "screen",
        bg: "bg.page",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <div>
        <h1
          className={css({
            fontWeight: "black",
            fontSize: "3xl",
            color: "text.primary",
          })}
        >
          Web site of illumination-k
        </h1>
        <p className={css({ color: "text.secondary" })}>
          This is the web site of illumination-k. The site is under
          construction.
        </p>

        <h2
          className={css({
            fontWeight: "bold",
            fontSize: "2xl",
            color: "text.primary",
            mt: 4,
          })}
        >
          Content Links
        </h2>
        <ul className={css({ listStyle: "inside" })}>
          <li>
            <Link
              className={css({
                textDecoration: "underline",
                color: "accent.primary",
                _hover: { color: "accent.hover" },
              })}
              href="/techblog/1"
            >
              Techblog
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
