import { css } from "@/styled-system/css";

import type { Metadata } from "next";

import { ProjectCard } from "@/features/oss/components/ProjectCard";
import { OSS_PROJECTS } from "@/features/oss/projects";
import GithubIcon from "@/icons/GithubIcon";
import { type Locale, getDictionary, isLocale } from "@/lib/i18n";
import { buildAlternates, buildOpenGraph, buildTwitterCard } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);
  return {
    title: dict.oss.title,
    description: dict.oss.description,
    alternates: buildAlternates({
      canonicalLocale: locale,
      buildPath: (l) => `/${l}/oss`,
    }),
    openGraph: buildOpenGraph({
      title: dict.oss.title,
      description: dict.oss.description,
      path: `/${locale}/oss`,
      locale,
    }),
    twitter: buildTwitterCard({
      title: dict.oss.title,
      description: dict.oss.description,
    }),
  };
}

export default async function OssPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);

  return (
    <div
      className={css({
        maxW: "5xl",
        mx: "auto",
        px: { base: 5, md: 8 },
        py: { base: 8, md: 12 },
      })}
    >
      <h1
        className={css({
          fontSize: { base: "2xl", md: "3xl" },
          fontWeight: "black",
          textAlign: "center",
          color: "text.primary",
          mb: 2,
        })}
      >
        {dict.oss.title}
      </h1>
      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "sm",
          mb: { base: 8, md: 10 },
        })}
      >
        {dict.oss.subtitle}
      </p>

      <ul
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", md: "1fr 1fr" },
          gap: 5,
          listStyle: "none",
          p: 0,
          m: 0,
        })}
      >
        {OSS_PROJECTS.map((project) => (
          <li key={project.repo}>
            <ProjectCard
              project={project}
              locale={locale}
              homepageLabel={dict.oss.homepage}
            />
          </li>
        ))}
      </ul>

      <div
        className={css({
          display: "flex",
          justifyContent: "center",
          mt: 10,
        })}
      >
        <a
          href="https://github.com/illumination-k?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: "text.secondary",
            fontSize: "sm",
            _hover: { color: "accent.primary" },
          })}
        >
          <GithubIcon aria-hidden="true" className={css({ h: 4, w: 4 })} />
          {dict.oss.moreOnGithub}
        </a>
      </div>
    </div>
  );
}
