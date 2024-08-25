import type { GetStaticProps, NextPage } from "next";
import { Fragment } from "react";

import Layout from "@/components/Layout";

type Props = {
  header: string;
  texts: { [key: string]: string };
};

const PrivacyPolicy: NextPage<Props> = ({ header, texts }: Props) => {
  return (
    <Layout title="Privacy Policy" description="Privacy Policy of illumination-k.dev">
      <h1>{header}</h1>
      {Object.entries(texts).map(([k, v], i) => {
        return (
          <Fragment key={i}>
            <h2>{k}</h2>
            <p>{v}</p>
          </Fragment>
        );
      })}
    </Layout>
  );
};

const JA_TEXT = {
  [`アクセス解析ツール`]:
    `当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにクッキー（Cookie）を使用しております。
  トラフィックデータは匿名で収集されており、個人を特定するものではありません。`,
  [`広告`]:
    `当サイトでは、Google Adsenceを利用しており、ユーザーの興味に応じた商品やサービスの広告を表示するため、クッキー（Cookie）を使用しております。
  クッキーを使用することで当サイトはお客様のコンピュータを識別できるようになりますが、お客様個人を特定できるものではありません。`,
  [`アフィリエイト`]:
    `当サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。`,
};

const EN_TEXT = {
  [`Access Analysis Tools`]:
    `This site uses Google Analytics, an access analysis tool provided by Google. This Google Analytics uses cookies to collect traffic data.
  Traffic data is collected anonymously and does not personally identify you.`,
  [`Advertisement`]:
    `This site uses Google Adsence, which uses cookies to display advertisements for products and services based on user interests.
  The use of cookies enables this site to identify your computer, but does not allow us to identify you personally.`,
  [`Affiliate`]:
    `This site is a participant in the Amazon Associates Program to earn referral fees by promoting and linking to Amazon.com.`,
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  return {
    props: {
      header: locale === "ja" ? "プライバシーポリシー" : "Privacy Policy",
      texts: locale === "ja" ? JA_TEXT : EN_TEXT,
    },
  };
};

export default PrivacyPolicy;
