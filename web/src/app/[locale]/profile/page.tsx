import { css } from "@/styled-system/css";

import type { Metadata } from "next";

import { EducationList } from "@/features/profile/components/EducationList";
import { EmploymentList } from "@/features/profile/components/EmploymentList";
import { WorkList } from "@/features/profile/components/WorkList";
import { profileRepository } from "@/features/profile/constants";
import GithubIcon from "@/icons/GithubIcon";
import LinkedInIcon from "@/icons/LinkedInIcon";
import OrcidIcon from "@/icons/OrcidIcon";
import TwitterIcon from "@/icons/TwitterIcon";
import { type Locale, getDictionary, isLocale } from "@/lib/i18n";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);
  return {
    title: dict.profile.title,
    description: dict.profile.description,
  };
}

const sectionHeadingStyle = css({
  fontSize: { base: "lg", md: "xl" },
  fontWeight: "bold",
  color: "text.primary",
  mb: 4,
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
});

const sectionStyle = css({
  bg: "bg.surface",
  borderWidth: 1,
  borderColor: "border.default",
  rounded: "xl",
  px: { base: 5, md: 7 },
  py: { base: 5, md: 6 },
  mb: 6,
});

export default async function ProfilePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const dict = await getDictionary(locale);
  const profile = await profileRepository.get();

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
        {dict.profile.title}
      </h1>
      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "sm",
          mb: 2,
        })}
      >
        {dict.profile.subtitle}
      </p>
      <div
        className={css({
          display: "flex",
          justifyContent: "center",
          mb: { base: 4, md: 5 },
        })}
      >
        <a
          href={`https://orcid.org/${profile.orcidId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
            fontSize: "sm",
            _hover: { color: "accent.primary" },
          })}
        >
          <OrcidIcon aria-hidden="true" className={css({ h: 4, w: 4 })} />
          ORCID: {profile.orcidId}
        </a>
      </div>

      {/* Social Links */}
      <div
        className={css({
          display: "flex",
          justifyContent: "center",
          gap: 5,
          alignItems: "center",
          mb: { base: 8, md: 10 },
        })}
      >
        <a
          href="https://www.github.com/illumination-k"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
            fontSize: "sm",
            transition: "colors",
            transitionDuration: "fast",
            _hover: { color: "accent.primary" },
          })}
        >
          <GithubIcon aria-hidden="true" className={css({ h: 5, w: 5 })} />
          <span>GitHub</span>
        </a>
        <a
          href="https://twitter.com/illuminationK"
          aria-label="Twitter"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
            fontSize: "sm",
            transition: "colors",
            transitionDuration: "fast",
            _hover: { color: "accent.primary" },
          })}
        >
          <TwitterIcon
            aria-hidden="true"
            className={css({ h: 5, w: 5, fill: "currentColor" })}
          />
          <span>Twitter</span>
        </a>
        <a
          href="https://www.linkedin.com/in/shogo-kawamura-77492b223"
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "text.secondary",
            fontSize: "sm",
            transition: "colors",
            transitionDuration: "fast",
            _hover: { color: "accent.primary" },
          })}
        >
          <LinkedInIcon aria-hidden="true" className={css({ h: 5, w: 5 })} />
          <span>LinkedIn</span>
        </a>
      </div>

      {/* Employment */}
      {profile.employments.length > 0 && (
        <section className={sectionStyle}>
          <h2 className={sectionHeadingStyle}>{dict.profile.employment}</h2>
          <EmploymentList
            employments={profile.employments}
            presentLabel={dict.profile.present}
          />
        </section>
      )}

      {/* Education */}
      {profile.educations.length > 0 && (
        <section className={sectionStyle}>
          <h2 className={sectionHeadingStyle}>{dict.profile.education}</h2>
          <EducationList
            educations={profile.educations}
            presentLabel={dict.profile.present}
          />
        </section>
      )}

      {/* Publications */}
      {profile.works.length > 0 && (
        <section className={sectionStyle}>
          <h2 className={sectionHeadingStyle}>{dict.profile.publications}</h2>
          <WorkList
            works={profile.works}
            ownOrcidId={profile.orcidId}
            ownerNames={profile.ownerNames}
          />
        </section>
      )}

      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "xs",
          mt: 10,
        })}
      >
        Data from ORCID (fetched:{" "}
        {new Date(profile.fetchedAt).toLocaleDateString()})
      </p>
    </div>
  );
}
