import Link from "next/link";

import { css } from "@/styled-system/css";

import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div
      className={css({
        h: "screen",
        bg: "sky.100",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <div>
        <h1 className={css({ fontWeight: "black", fontSize: "3xl" })}>
          Web site of illumination-k
        </h1>
        <p>
          This is the web site of illumination-k. The site is under
          construction.
        </p>

        <h2 className={css({ fontWeight: "bold", fontSize: "2xl" })}>
          Content Links
        </h2>
        <ul className={css({ listStyle: "inside" })}>
          <li>
            <Link
              className={css({
                textDecoration: "underline",
                color: "blue.700",
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
