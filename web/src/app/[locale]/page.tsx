import { Caveat } from "next/font/google";
import Link from "next/link";

import { css, cx } from "@/styled-system/css";

import {
  BookOpenIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import type { Route } from "next";

import { type Locale, getDictionary, isLocale } from "@/lib/i18n";

const caveat = Caveat({ subsets: ["latin"] });

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);

  return (
    <div
      className={css({
        minH: "calc(100vh - 120px)",
        bg: "bg.page",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 6,
        py: 16,
      })}
    >
      <div
        className={css({
          maxW: "lg",
          w: "full",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        })}
      >
        {/* Name */}
        <div
          className={css({
            textAlign: "center",
            animation: "fadeInUp 0.6s ease-out",
          })}
        >
          <h1
            className={cx(
              css({
                fontSize: { base: "4xl", md: "5xl" },
                color: "accent.primary",
                fontWeight: "black",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
              }),
              caveat.className,
            )}
          >
            illumination-k
          </h1>
          <p
            className={css({
              mt: 3,
              color: "text.secondary",
              fontSize: { base: "sm", md: "md" },
              lineHeight: "1.7",
            })}
          >
            {dict.home.subtitle}
          </p>
        </div>

        {/* Divider */}
        <div
          className={css({
            w: 12,
            h: "1px",
            bg: "border.default",
            animation: "fadeInUp 0.6s ease-out 0.1s both",
          })}
        />

        {/* Profile Link */}
        <Link
          href={`/${locale}/profile` as Route}
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            px: 5,
            py: 2.5,
            rounded: "full",
            bg: "bg.surface",
            borderWidth: 1,
            borderColor: "border.default",
            color: "text.secondary",
            fontSize: "sm",
            fontWeight: "medium",
            transition: "all",
            transitionDuration: "normal",
            animation: "fadeInUp 0.6s ease-out 0.2s both",
            _hover: {
              borderColor: "accent.primary",
              color: "accent.primary",
              transform: "translateY(-1px)",
            },
          })}
        >
          <UserIcon aria-hidden="true" className={css({ h: 4, w: 4 })} />
          <span>{dict.home.profile}</span>
        </Link>

        {/* Content Cards */}
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", sm: "1fr 1fr" },
            gap: 4,
            w: "full",
            mt: 2,
            animation: "fadeInUp 0.6s ease-out 0.3s both",
          })}
        >
          <Link
            href={`/${locale}/techblog/1` as Route}
            className={css({
              display: "flex",
              alignItems: "center",
              gap: 4,
              px: 6,
              py: 5,
              rounded: "xl",
              bg: "bg.surface",
              borderWidth: 1,
              borderColor: "border.default",
              transition: "all",
              transitionDuration: "normal",
              _hover: {
                borderColor: "accent.primary",
                transform: "translateY(-2px)",
                shadow: "0 4px 20px rgba(14, 165, 233, 0.12)",
              },
            })}
          >
            <BookOpenIcon
              className={css({
                h: 6,
                w: 6,
                color: "accent.primary",
                flexShrink: 0,
              })}
            />
            <div>
              <span
                className={css({
                  fontWeight: "bold",
                  fontSize: "lg",
                  color: "text.primary",
                })}
              >
                {dict.home.techBlog}
              </span>
              <p
                className={css({
                  color: "text.tertiary",
                  fontSize: "xs",
                  mt: 0.5,
                })}
              >
                {dict.home.techBlogSub}
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/paperstream/1` as Route}
            className={css({
              display: "flex",
              alignItems: "center",
              gap: 4,
              px: 6,
              py: 5,
              rounded: "xl",
              bg: "bg.surface",
              borderWidth: 1,
              borderColor: "border.default",
              transition: "all",
              transitionDuration: "normal",
              _hover: {
                borderColor: "accent.primary",
                transform: "translateY(-2px)",
                shadow: "0 4px 20px rgba(14, 165, 233, 0.12)",
              },
            })}
          >
            <DocumentTextIcon
              className={css({
                h: 6,
                w: 6,
                color: "accent.primary",
                flexShrink: 0,
              })}
            />
            <div>
              <span
                className={css({
                  fontWeight: "bold",
                  fontSize: "lg",
                  color: "text.primary",
                })}
              >
                {dict.home.paperStream}
              </span>
              <p
                className={css({
                  color: "text.tertiary",
                  fontSize: "xs",
                  mt: 0.5,
                })}
              >
                {dict.home.paperStreamSub}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
