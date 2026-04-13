import { css } from "@/styled-system/css";

import type { ProfileEducation } from "common/profile";

interface Props {
  educations: ProfileEducation[];
  presentLabel: string;
}

export function EducationList({ educations, presentLabel }: Props) {
  return (
    <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
      {educations.map((edu) => (
        <li
          key={`${edu.organizationName}-${edu.startDate}`}
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
              {edu.organizationName}
            </h3>
            <span
              className={css({
                fontSize: "sm",
                color: "text.tertiary",
                flexShrink: 0,
              })}
            >
              {edu.startDate ?? ""} — {edu.endDate ?? presentLabel}
            </span>
          </div>
          {(edu.role || edu.departmentName) && (
            <p
              className={css({
                fontSize: "sm",
                color: "text.secondary",
                mt: 1,
              })}
            >
              {[edu.role, edu.departmentName].filter(Boolean).join(" / ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
