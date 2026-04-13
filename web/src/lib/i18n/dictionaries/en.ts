import type { Dictionary } from "../types";

const en: Dictionary = {
  home: {
    subtitle: "Software Engineer / Bioinformatics",
    techBlog: "Tech Blog",
    techBlogSub: "Technical articles",
    paperStream: "Paper Stream",
    paperStreamSub: "Paper notes",
  },
  nav: {
    techBlog: "TechBlog",
  },
  footer: {
    privacyPolicy: "privacy policy",
    disclaimer: "disclaimer",
  },
  meta: {
    siteDescription: "Software Engineer / Bioinformatics",
    articleList: (prefix: string) => `${prefix} Articles`,
    articleListPage: (prefix: string, page: number | string) =>
      `${prefix} Articles - Page ${page}`,
    articleListDescription: (prefix: string, page: number | string) =>
      `Article list of ${prefix} on illumination-k.dev (Page ${page})`,
    tagArticleList: (tag: string) => `Articles tagged "${tag}"`,
    tagArticleListPage: (tag: string, page: number | string) =>
      `Articles tagged "${tag}" - Page ${page}`,
    tagArticleListDescription: (tag: string, page: number | string) =>
      `Articles tagged "${tag}" on illumination-k.dev (Page ${page})`,
    tagList: (prefix: string) => `${prefix} Tags`,
    tagListDescription: (prefix: string) =>
      `List of tags used in ${prefix} articles on illumination-k.dev`,
  },
  search: {
    placeholder: "Search articles...",
  },
  disclaimer: {
    title: "Disclaimer",
    subtitle: "Disclaimer",
    effectiveDate: "Effective: January 1, 2020 / Last updated: January 1, 2025",
    sections: [
      {
        title: "Disclaimer",
        body: "The information published on this site is current as of the date of publication and may differ from the latest information. While we strive to provide accurate information, we do not guarantee its accuracy or safety. We accept no responsibility for any damage caused by the content published on this site.",
      },
      {
        title: "External Links",
        body: "We accept no responsibility for the information or services provided on other sites accessed via links or banners on this site. URLs of links on this site may be changed or removed without notice.",
      },
      {
        title: "Copyright",
        body: "Content published on this site (text, images, source code, etc.) is protected by copyright law. Unauthorized reproduction beyond the scope of fair use is prohibited. When quoting, please include a link to this site as the source. Unless otherwise stated, source code is provided under the MIT License.",
      },
      {
        title: "Intellectual Property Infringement",
        body: "This site does not intend to infringe on any copyrights or portrait rights. If you have any concerns regarding copyright or portrait rights, please create an Issue on the GitHub repository or contact illumination-k@gmail.com. We will respond promptly.",
      },
      {
        title: "Accuracy of Content",
        body: "Articles on this site are written as outputs of personal learning and research. While we verify technical content as much as possible, there may be errors. If you find any errors, we would appreciate it if you could create an Issue on the GitHub repository.",
      },
      {
        title: "Limitation of Liability",
        body: 'The operator of this site accepts no responsibility for any damage arising from the use of information or materials on this site, or from content on third-party websites linked from this site. Content on this site is provided "as is" without warranty of any kind.',
      },
    ],
  },
  privacyPolicy: {
    title: "Privacy Policy",
    subtitle: "Privacy Policy",
    effectiveDate: "Effective: January 1, 2020 / Last updated: January 1, 2025",
    sections: [
      {
        title: "Purpose of Personal Information Use",
        body: "We may collect personal information such as your name and email address when you contact us. This personal information is used solely to respond to your inquiries and provide necessary information, and will not be used for any other purpose.",
      },
      {
        title: "Analytics Tools",
        body: "This site uses Google Analytics, an analytics tool provided by Google. Google Analytics uses cookies to collect traffic data. Traffic data is collected anonymously and does not identify individuals. You can refuse data collection by disabling cookies in your browser settings. Please refer to Google's page for the Google Analytics Terms of Service.",
      },
      {
        title: "Advertising",
        body: "This site uses Google AdSense, a third-party advertising service. Advertisers may use cookies to display ads based on user interests. For settings to disable cookies and details about Google AdSense, please refer to Google's policies and terms page.",
      },
      {
        title: "Affiliate Programs",
        body: "This site participates in the Amazon Associates Program, an affiliate advertising program designed to provide a means for sites to earn referral fees by advertising and linking to Amazon.co.jp.",
      },
      {
        title: "Comments and Inquiries",
        body: "To combat spam and abuse, this site may record IP addresses used when commenting or making inquiries. This is a standard feature supported by the site and will not be used for any purpose other than combating spam and abuse.",
      },
      {
        title: "Disclaimer",
        body: "While we strive to provide accurate information on this site, we do not guarantee its accuracy or safety. We accept no responsibility for any damage caused by the content published on this site. We also accept no responsibility for information or services provided on other sites accessed via links or banners on this site.",
      },
      {
        title: "Changes to Privacy Policy",
        body: "This site complies with applicable Japanese laws regarding personal information and strives to review and improve this policy as appropriate. The latest revised privacy policy will always be disclosed on this page.",
      },
    ],
  },
  post: {
    archiveWarning:
      "This article has been archived. The content may be outdated.",
    draftWarning: "This article is still a draft.",
    aiGeneratedWarning:
      "This article was generated by AI. Please be cautious about the accuracy of its content.",
    githubIssuePrompt: "Create an issue on GitHub about this article",
    readNext: "Read Next",
  },
  profile: {
    title: "Profile",
    subtitle: "Employment, Education & Publications",
    description:
      "Profile of illumination-k — employment, education, and publications (via ORCID)",
    employment: "Employment",
    education: "Education",
    publications: "Publications",
    present: "Present",
  },
  metrics: {
    title: "Quality Metrics",
    subtitle: "Test coverage and mutation score trends",
    description:
      "Code quality metrics for illumination-k.dev — test coverage and mutation score trends",
  },
};

export default en;
