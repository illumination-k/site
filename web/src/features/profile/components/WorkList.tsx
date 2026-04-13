import { Fragment } from "react";

import { css } from "@/styled-system/css";

import type { ProfileWork } from "common/profile";

interface Props {
  works: ProfileWork[];
  ownOrcidId?: string;
  ownerNames?: string[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function WorkList({ works, ownOrcidId, ownerNames }: Props) {
  const ownNameSet = new Set((ownerNames ?? []).map(normalizeName));
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
          {work.authors && work.authors.length > 0 && (
            <p
              className={css({
                fontSize: "xs",
                color: "text.secondary",
                mt: 1,
                lineHeight: "1.6",
              })}
            >
              {work.authors.map((author, idx) => {
                const matchesOrcid =
                  ownOrcidId !== undefined && author.orcid === ownOrcidId;
                const matchesName =
                  author.orcid === undefined &&
                  ownNameSet.has(normalizeName(author.name));
                const isOwn = matchesOrcid || matchesName;
                return (
                  <Fragment key={`${author.orcid ?? author.name}-${idx}`}>
                    {idx > 0 && ", "}
                    <span
                      className={
                        isOwn
                          ? css({
                              fontWeight: "bold",
                              color: "text.primary",
                            })
                          : undefined
                      }
                    >
                      {author.name}
                    </span>
                  </Fragment>
                );
              })}
            </p>
          )}
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
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: 3,
              mt: 1,
              flexWrap: "wrap",
            })}
          >
            {work.doi && (
              <span
                className={css({
                  fontSize: "xs",
                  color: "text.tertiary",
                })}
              >
                DOI: {work.doi}
              </span>
            )}
            {work.citationCount != null && work.citationCount > 0 && (
              <span
                className={css({
                  fontSize: "xs",
                  color: "text.secondary",
                  fontWeight: "medium",
                })}
              >
                Cited by {work.citationCount}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
