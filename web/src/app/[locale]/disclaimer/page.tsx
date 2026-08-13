import { css } from "@/styled-system/css";

import type { Metadata } from "next";

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
    // The [locale] layout's title template already appends
    // " | illumination-k.dev"; repeating it here doubled the suffix.
    title: dict.disclaimer.title,
    description: `illumination-k.dev ${dict.disclaimer.title}`,
    alternates: buildAlternates({
      canonicalLocale: locale,
      buildPath: (l) => `/${l}/disclaimer`,
    }),
    openGraph: buildOpenGraph({
      title: dict.disclaimer.title,
      description: `illumination-k.dev ${dict.disclaimer.title}`,
      path: `/${locale}/disclaimer`,
      locale,
    }),
    twitter: buildTwitterCard({
      title: dict.disclaimer.title,
      description: `illumination-k.dev ${dict.disclaimer.title}`,
    }),
  };
}

export default async function DisclaimerPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);

  return (
    <div
      className={css({
        maxW: "3xl",
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
        {dict.disclaimer.title}
      </h1>
      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "sm",
          mb: { base: 8, md: 10 },
        })}
      >
        {dict.disclaimer.subtitle}
      </p>

      <div
        className={css({ display: "flex", flexDirection: "column", gap: 8 })}
      >
        {dict.disclaimer.sections.map((section, i) => (
          <section
            key={i}
            className={css({
              bg: "bg.surface",
              borderWidth: 1,
              borderColor: "border.default",
              rounded: "xl",
              px: { base: 5, md: 7 },
              py: { base: 5, md: 6 },
            })}
          >
            <h2
              className={css({
                fontSize: { base: "lg", md: "xl" },
                fontWeight: "bold",
                color: "text.primary",
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 2,
                _before: {
                  content: '""',
                  display: "block",
                  w: 1,
                  h: 5,
                  bg: "accent.primary",
                  rounded: "full",
                  flexShrink: 0,
                },
              })}
            >
              {section.title}
            </h2>
            <p
              className={css({
                color: "text.secondary",
                fontSize: { base: "sm", md: "md" },
                lineHeight: "1.8",
              })}
            >
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "xs",
          mt: 10,
        })}
      >
        {dict.disclaimer.effectiveDate}
      </p>
    </div>
  );
}
