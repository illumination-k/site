import { css } from "@/styled-system/css";

import type { ProfileFunding } from "common/profile";

interface Props {
  fundings: ProfileFunding[];
  presentLabel: string;
}

export function FundingList({ fundings, presentLabel }: Props) {
  return (
    <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
      {fundings.map((funding) => (
        <li
          key={`${funding.title}-${funding.grantNumber ?? funding.startDate}`}
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
                fontSize: { base: "md", md: "lg" },
                fontWeight: "bold",
                color: "text.primary",
              })}
            >
              {funding.url ? (
                <a
                  href={funding.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: "accent.primary",
                    textDecoration: "none",
                    _hover: { textDecoration: "underline" },
                  })}
                >
                  {funding.title}
                </a>
              ) : (
                funding.title
              )}
            </h3>
            {funding.startDate && (
              <span
                className={css({
                  fontSize: "sm",
                  color: "text.tertiary",
                  flexShrink: 0,
                })}
              >
                {funding.startDate} — {funding.endDate ?? presentLabel}
              </span>
            )}
          </div>
          <p
            className={css({
              fontSize: "sm",
              color: "text.secondary",
              mt: 1,
            })}
          >
            {[funding.organizationName, funding.type, funding.grantNumber]
              .filter(Boolean)
              .join(" / ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
