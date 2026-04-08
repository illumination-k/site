interface Section {
  title: string;
  body: string;
}

export interface Dictionary {
  home: {
    subtitle: string;
    techBlog: string;
    techBlogSub: string;
    paperStream: string;
    paperStreamSub: string;
  };
  nav: {
    techBlog: string;
  };
  footer: {
    privacyPolicy: string;
    disclaimer: string;
  };
  meta: {
    siteDescription: string;
    articleList: (prefix: string) => string;
    articleListPage: (prefix: string, page: number | string) => string;
    articleListDescription: (prefix: string, page: number | string) => string;
    tagArticleList: (tag: string) => string;
    tagArticleListPage: (tag: string, page: number | string) => string;
    tagArticleListDescription: (tag: string, page: number | string) => string;
    tagList: (prefix: string) => string;
    tagListDescription: (prefix: string) => string;
  };
  search: {
    placeholder: string;
  };
  disclaimer: {
    title: string;
    subtitle: string;
    effectiveDate: string;
    sections: Section[];
  };
  privacyPolicy: {
    title: string;
    subtitle: string;
    effectiveDate: string;
    sections: Section[];
  };
  metrics: {
    title: string;
    subtitle: string;
    description: string;
  };
}
