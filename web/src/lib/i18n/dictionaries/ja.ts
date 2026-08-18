import type { Dictionary } from "../types";

const ja: Dictionary = {
  // Home page
  home: {
    subtitle: "Software Engineer / Bioinformatics",
    techBlog: "Tech Blog",
    techBlogSub: "技術ブログ",
    paperStream: "Paper Stream",
    paperStreamSub: "論文メモ",
    profile: "プロフィール",
  },
  // Navigation
  nav: {
    techBlog: "TechBlog",
  },
  // Footer
  footer: {
    privacyPolicy: "privacy policy",
    disclaimer: "disclaimer",
  },
  // Metadata
  meta: {
    siteDescription: "Software Engineer / Bioinformatics",
    articleList: (prefix: string) => `${prefix} 記事一覧`,
    articleListPage: (prefix: string, page: number | string) =>
      `${prefix} 記事一覧 - ページ ${page}`,
    articleListDescription: (prefix: string, page: number | string) =>
      `illumination-k.dev の${prefix}記事一覧（ページ ${page}）`,
    tagArticleList: (tag: string) => `${tag} タグの記事一覧`,
    tagArticleListPage: (tag: string, page: number | string) =>
      `${tag} タグの記事一覧 - ページ ${page}`,
    tagArticleListDescription: (tag: string, page: number | string) =>
      `illumination-k.dev の「${tag}」タグが付いた記事一覧（ページ ${page}）`,
    tagList: (prefix: string) => `${prefix} タグ一覧`,
    tagListDescription: (prefix: string) =>
      `illumination-k.dev の${prefix}記事に付けられたタグの一覧`,
    tagNetwork: (prefix: string) => `${prefix} タグネットワーク`,
    tagNetworkDescription: (prefix: string) =>
      `illumination-k.dev の${prefix}記事のタグ共起ネットワーク`,
    search: "記事検索",
    searchDescription: "illumination-k.dev の記事を検索します",
  },
  // Search
  search: {
    placeholder: "記事を検索...",
  },
  // Disclaimer page
  disclaimer: {
    title: "免責事項",
    subtitle: "Disclaimer",
    effectiveDate: "制定日: 2020年1月1日 / 最終更新日: 2025年1月1日",
    sections: [
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
    ],
  },
  // Privacy Policy page
  privacyPolicy: {
    title: "プライバシーポリシー",
    subtitle: "Privacy Policy",
    effectiveDate: "制定日: 2020年1月1日 / 最終更新日: 2025年1月1日",
    sections: [
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
    ],
  },
  // Post
  post: {
    archiveWarning:
      "この記事はArchiveされています。記事の内容が古い可能性が高いです。",
    draftWarning: "この記事はドラフト段階です。",
    aiGeneratedWarning:
      "この記事はAIによって生成されています。内容の正確性にご注意ください。",
    githubIssuePrompt: "この記事に関するIssueをGithubで作成する",
    readNext: "次に読む",
  },
  // Profile page
  profile: {
    title: "Profile",
    subtitle: "経歴・学歴・論文",
    description:
      "illumination-k のプロフィール — 経歴・学歴・論文一覧（ORCID連携）",
    biography: "経歴書",
    // 資格・受賞歴・特技・趣味は公開情報から確認できないため未記載。
    // 追記する場合は 3 言語すべてを更新し、日本語は 700 文字以内に収めること
    // （web/src/lib/i18n/biography.test.ts が文字数と三人称表記を検証する）。
    biographyParagraphs: [
      "Shogo Kawamura は、分子生物学とバイオインフォマティクス、およびソフトウェアエンジニアリングを専門とする。京都大学農学部を卒業後、同大学院生命科学研究科で分子生物学を専攻し、2023年に博士号を取得した。博士課程在学中は日本学術振興会特別研究員（2021年〜2023年）を務めた。",
      "研究テーマはゼニゴケ Marchantia polymorpha のゲノム・トランスクリプトーム解析であり、公開データベース MarpolBase および MarpolBase Expression の開発、性決定因子の同定、深層学習を用いた形態変異の解析などに携わってきた。成果は Current Biology、Cell Reports、Plant and Cell Physiology 等の学術誌に発表されている。",
      "2023年より Preferred Networks でリサーチャー／エンジニアとして機械学習に関する研究開発に従事するかたわら、ゼニゴケ類のゲノム解析プロジェクトにも共同研究者として参加を続けている。",
    ],
    employment: "職歴",
    education: "学歴",
    publications: "論文",
    present: "現在",
  },
};

export default ja;
