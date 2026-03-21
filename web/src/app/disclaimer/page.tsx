import { css } from "@/styled-system/css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "免責事項 | illumination-k.dev",
  description: "illumination-k.dev の免責事項・著作権について",
};

const sections = [
  {
    title: "免責事項",
    body: "当サイトに掲載する情報は記事の公開時点のものであり、最新の情報とは異なる場合があります。できる限り正確な情報を提供するよう努めておりますが、正確性や安全性を保証するものではありません。当サイトに掲載された内容によって生じた損害等について、一切の責任を負いかねますのでご了承ください。",
  },
  {
    title: "外部リンクについて",
    body: "当サイトからリンクやバナーなどによって他のサイトに移動した場合、移動先サイトで提供される情報やサービス等について一切の責任を負いません。当サイトに掲載しているリンク先の URL は予告なく変更・削除される場合があります。",
  },
  {
    title: "著作権について",
    body: "当サイトで掲載しているコンテンツ（文章・画像・ソースコード等）は、著作権法により保護されています。引用の範囲を超えた無断転載は禁止します。引用する際は、引用元として当サイトへのリンクを掲載してください。ソースコードについては、特に記載がない限り MIT ライセンスに準じるものとします。",
  },
  {
    title: "肖像権・著作権の侵害について",
    body: "当サイトは著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、お手数ですが GitHub リポジトリに Issue を作成するか、illumination-k@gmail.com までご連絡ください。迅速に対応いたします。",
  },
  {
    title: "コンテンツの正確性について",
    body: "当サイトの記事は個人の学習・研究のアウトプットとして執筆されています。技術的な内容については可能な限り検証を行っておりますが、記載内容に誤りがある場合があります。誤りを発見された場合は GitHub リポジトリに Issue を作成していただけると幸いです。",
  },
  {
    title: "損害等の責任について",
    body: "当サイトに掲載された情報・資料の利用、コンテンツの利用、または当サイトにリンクされた第三者のウェブサイトの内容に起因して生じた損害について、当サイトの運営者は一切の責任を負いません。当サイトのコンテンツは「現状有姿」で提供されるものとし、いかなる種類の保証も行いません。",
  },
];

export default function DisclaimerPage() {
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
        免責事項
      </h1>
      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "sm",
          mb: { base: 8, md: 10 },
        })}
      >
        Disclaimer
      </p>

      <div
        className={css({ display: "flex", flexDirection: "column", gap: 8 })}
      >
        {sections.map((section, i) => (
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
        制定日: 2020年1月1日 / 最終更新日: 2025年1月1日
      </p>
    </div>
  );
}
