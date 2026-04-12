import { css } from "@/styled-system/css";

import type { ProfileWork } from "common/profile";

interface Props {
  works: ProfileWork[];
}

export function WorkList({ works }: Props) {
  return (
    <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
      {works.map((work) => (
        <li
          key={`${work.title}-${work.publicationYear}`}
          className={css({
            py: 4,
            borderBottomWidth: 1,
            borderColor: "border.default",
            _last: { borderBottomWidth: 0 },
          })}
        >
          <div
            className={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 2,
            })}
          >
            <h3
              className={css({
                fontSize: { base: "sm", md: "md" },
                fontWeight: "bold",
                color: "text.primary",
                flex: 1,
                minW: 0,
              })}
            >
              {work.doi ? (
                <a
                  href={`https://doi.org/${work.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: "accent.primary",
                    textDecoration: "none",
                    _hover: { textDecoration: "underline" },
                  })}
                >
                  {work.title}
                </a>
              ) : work.url ? (
                <a
                  href={work.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: "accent.primary",
                    textDecoration: "none",
                    _hover: { textDecoration: "underline" },
                  })}
                >
                  {work.title}
                </a>
              ) : (
                work.title
              )}
            </h3>
            {work.publicationYear && (
              <span
                className={css({
                  fontSize: "sm",
                  color: "text.tertiary",
                  flexShrink: 0,
                })}
              >
                {work.publicationYear}
              </span>
            )}
          </div>
          {work.journalTitle && (
            <p
              className={css({
                fontSize: "sm",
                color: "text.secondary",
                mt: 1,
                fontStyle: "italic",
              })}
            >
              {work.journalTitle}
            </p>
          )}
          {work.doi && (
            <p
              className={css({
                fontSize: "xs",
                color: "text.tertiary",
                mt: 1,
              })}
            >
              DOI: {work.doi}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
