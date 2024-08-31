import { Fragment } from "react";

import { css } from "@/styled-system/css";

const PrivacyPolicy = ({}) => {
  const header = "プライバシーポリシー";
  const texts = JA_TEXT;
  return (
    <div className={css({ lg: { display: "grid", gridTemplateColumns: 12 } })}>
      <div
        className={css({
          textAlign: "center",
          lg: { gridColumnStart: 4, gridColumnEnd: 10 },
        })}
      >
        <h1 className={css({ fontSize: "3xl", fontWeight: "black" })}>
          {header}
        </h1>{" "}
        {Object.entries(texts).map(([k, v], i) => {
          return (
            <Fragment key={i}>
              <h2
                className={css({ fontSize: "2xl", fontWeight: "bold", m: 2 })}
              >
                {k}
              </h2>
              <p>{v}</p>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

const JA_TEXT = {
  [`アクセス解析ツール`]: `当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにクッキー（Cookie）を使用しております。
  トラフィックデータは匿名で収集されており、個人を特定するものではありません。`,
  [`広告`]: `当サイトでは、Google Adsenceを利用しており、ユーザーの興味に応じた商品やサービスの広告を表示するため、クッキー（Cookie）を使用しております。
  クッキーを使用することで当サイトはユーザーのコンピュータを識別できるようになりますが、ユーザー個人を特定できるものではありません。`,
  [`アフィリエイト`]: `当サイトは、Google AdsenseおよびAmazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。`,
};

// eslint-disable-next-line
const EN_TEXT = {
  [`Access Analysis Tools`]: `This site uses Google Analytics, an access analysis tool provided by Google. This Google Analytics uses cookies to collect traffic data.
  Traffic data is collected anonymously and does not personally identify you.`,
  [`Advertisement`]: `This site uses Google Adsence, which uses cookies to display advertisements for products and services based on user interests.
  The use of cookies enables this site to identify your computer, but does not allow us to identify you personally.`,
  [`Affiliate`]: `This site is a participant in the Amazon Associates Program to earn referral fees by promoting and linking to Amazon.com.`,
};

export default PrivacyPolicy;
