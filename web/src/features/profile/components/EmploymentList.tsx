import { css } from "@/styled-system/css";

import type { ProfileEmployment } from "common/profile";

interface Props {
  employments: ProfileEmployment[];
  presentLabel: string;
}

export function EmploymentList({ employments, presentLabel }: Props) {
  return (
    <ul className={css({ listStyle: "none", p: 0, m: 0 })}>
      {employments.map((emp) => (
        <li
          key={`${emp.organizationName}-${emp.startDate}`}
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
              {emp.organizationName}
            </h3>
            <span
              className={css({
                fontSize: "sm",
                color: "text.tertiary",
                flexShrink: 0,
              })}
            >
              {emp.startDate ?? ""} — {emp.endDate ?? presentLabel}
            </span>
          </div>
          {(emp.role || emp.departmentName) && (
            <p
              className={css({
                fontSize: "sm",
                color: "text.secondary",
                mt: 1,
              })}
            >
              {[emp.role, emp.departmentName].filter(Boolean).join(" / ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
