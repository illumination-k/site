import { css } from "@/styled-system/css";

import GithubIcon from "@/icons/GithubIcon";
import type { Locale } from "@/lib/i18n";

import { type OssProject, githubUrl } from "../projects";

interface Props {
  project: OssProject;
  locale: Locale;
  homepageLabel: string;
}

const linkStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  color: "text.secondary",
  fontSize: "sm",
  transition: "colors",
  transitionDuration: "fast",
  _hover: { color: "accent.primary" },
});

const chipStyle = css({
  fontSize: "xs",
  px: 2,
  py: 0.5,
  rounded: "full",
  borderWidth: 1,
  borderColor: "border.default",
  color: "text.tertiary",
});

export function ProjectCard({ project, locale, homepageLabel }: Props) {
  const repoUrl = githubUrl(project);

  return (
    <article
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: 3,
        h: "full",
        bg: "bg.surface",
        borderWidth: 1,
        borderColor: "border.default",
        rounded: "xl",
        px: { base: 5, md: 6 },
        py: 5,
        transition: "all",
        transitionDuration: "normal",
        _hover: { borderColor: "accent.primary" },
      })}
    >
      <header
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        })}
      >
        <h2
          className={css({
            fontSize: "lg",
            fontWeight: "bold",
            color: "text.primary",
            wordBreak: "break-word",
          })}
        >
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={css({ _hover: { color: "accent.primary" } })}
          >
            {project.name}
          </a>
        </h2>
        <span
          className={css({
            fontSize: "xs",
            color: "text.tertiary",
            flexShrink: 0,
          })}
        >
          {project.languages.join(" / ")}
        </span>
      </header>

      <p
        className={css({
          color: "text.secondary",
          fontSize: "sm",
          lineHeight: "1.7",
          flexGrow: 1,
        })}
      >
        {project.description[locale]}
      </p>

      {project.tags.length > 0 && (
        <ul
          aria-label="tags"
          className={css({
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            listStyle: "none",
            p: 0,
            m: 0,
          })}
        >
          {project.tags.map((tag) => (
            <li key={tag} className={chipStyle}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          pt: 3,
          borderTopWidth: 1,
          borderColor: "border.default",
        })}
      >
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkStyle}
        >
          <GithubIcon aria-hidden="true" className={css({ h: 4, w: 4 })} />
          {project.repo}
        </a>
        {project.homepage && (
          <a
            href={project.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyle}
          >
            {homepageLabel}
          </a>
        )}
        {project.packages?.map((pkg) => (
          <a
            key={pkg.url}
            href={pkg.url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyle}
          >
            {pkg.label}
          </a>
        ))}
      </div>
    </article>
  );
}
