import { Fragment } from "react";

import { css } from "@/styled-system/css";

const TermsService = ({}) => {
  const header = "免責事項・著作権";
  const texts = JA_TEXT;
  return (
    <div className={css({ lg: { display: "grid", gridTemplateColumns: 12 } })}>
      <div className={css({ textAlign: "center", lg: { gridColumnStart: 4, gridColumnEnd: 10 } })}>
        <h1 className={css({ fontSize: "3xl", fontWeight: "black" })}>{header}</h1>
        {Object.entries(texts).map(([k, v], i) => {
          return (
            <Fragment key={i}>
              <h2 className={css({ fontSize: "2xl", fontWeight: "bold", m: 2 })}>{k}</h2>
              <p>{v}</p>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

const JA_TEXT = {
  [`免責事項`]:
    `当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について一切の責任を負いません。
また当サイトのコンテンツ・情報について、できる限り正確な情報を提供するように努めておりますが、正確性や安全性を保証するものではありません。情報が古くなっていることもございます。
当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。`,
  [`著作権`]: `当サイトで掲載している文章や画像などにつきましては、無断転載することを禁止します。
  当ブログは著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、
当サイトのGithub repositoryにIssueを作成するかillumination-k＠gmail.comまでご連絡ください。`,
};

const EN_TEXT = { // eslint-disable-line
  [`Disclaimer `]:
    `I am not responsible for any information, services, etc. provided on sites to which you are redirected by links, banners, etc. from this site.
    While I try to provide as much accurate information as possible regarding the contents and information on this site, I cannot guarantee the accuracy or accuracy or safety of the information. Some of information may be out of date.
    Please note that we are not responsible for any damages or other losses caused by the content of this site.`,
  [`Copyright`]: `Unauthorized reproduction of any text, images, etc. posted on this site is prohibited.
    This blog is not intended to infringe on copyrights or portrait rights. If you have any issues regarding copyright or portrait rights, please create an Issue in Github repository of this site or contact me at illumination-k@gmail.com.`,
};

export default TermsService;
