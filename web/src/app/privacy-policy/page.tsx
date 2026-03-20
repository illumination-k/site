import type { Metadata } from "next";

import { css } from "@/styled-system/css";

export const metadata: Metadata = {
  title: "プライバシーポリシー | illumination-k.dev",
  description: "illumination-k.dev のプライバシーポリシー",
};

const sections = [
  {
    title: "個人情報の利用目的",
    body: "当サイトでは、お問い合わせの際に名前やメールアドレス等の個人情報をご登録いただく場合がございます。これらの個人情報は、お問い合わせに対する回答や必要な情報をご連絡するために利用し、それ以外の目的では利用いたしません。",
  },
  {
    title: "アクセス解析ツール",
    body: "当サイトでは、Googleによるアクセス解析ツール「Google アナリティクス」を利用しています。Google アナリティクスはトラフィックデータの収集のために Cookie を使用しています。トラフィックデータは匿名で収集されており、個人を特定するものではありません。Cookie の無効化によりデータ収集を拒否することができますので、お使いのブラウザの設定をご確認ください。Google アナリティクスの利用規約については Google のページをご覧ください。",
  },
  {
    title: "広告について",
    body: "当サイトでは、第三者配信の広告サービス「Google アドセンス」を利用しています。広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。Cookie を無効にする設定および Google アドセンスに関する詳細は、Google のポリシーと規約ページをご覧ください。",
  },
  {
    title: "アフィリエイトについて",
    body: "当サイトは、Amazon.co.jp を宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazon アソシエイト・プログラムの参加者です。",
  },
  {
    title: "コメント・お問い合わせについて",
    body: "当サイトでは、スパムや荒らしへの対応として、コメント・お問い合わせの際に使用された IP アドレスを記録する場合があります。これは当サイトの標準機能としてサポートされているものであり、スパムや荒らしへの対応以外にこの IP アドレスを使用することはありません。",
  },
  {
    title: "免責事項",
    body: "当サイトに掲載する情報は、できる限り正確な情報を提供するよう努めておりますが、正確性や安全性を保証するものではありません。当サイトに掲載された内容によって生じた損害等について、一切の責任を負いかねますのでご了承ください。また、当サイトからリンクやバナーなどによって他のサイトに移動した場合、移動先サイトで提供される情報やサービス等について一切の責任を負いません。",
  },
  {
    title: "プライバシーポリシーの変更",
    body: "当サイトは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直し改善に努めます。修正された最新のプライバシーポリシーは常に本ページにて開示されます。",
  },
];

export default function PrivacyPolicyPage() {
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
        プライバシーポリシー
      </h1>
      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "sm",
          mb: { base: 8, md: 10 },
        })}
      >
        Privacy Policy
      </p>

      <div className={css({ display: "flex", flexDirection: "column", gap: 8 })}>
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
