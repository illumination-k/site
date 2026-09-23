import type { Locale } from "@/lib/i18n";

export interface OssProject {
  /** Display name. Usually the repository name. */
  name: string;
  /** `owner/repo` on GitHub. */
  repo: string;
  /** Primary implementation language(s). */
  languages: string[];
  tags: string[];
  description: Record<Locale, string>;
  /** Documentation site or other landing page, if any. */
  homepage?: string;
  /** Package registries the project is published to. */
  packages?: { label: string; url: string }[];
}

/**
 * Curated list of OSS projects shown on `/[locale]/oss`. Order is the display
 * order, so keep the most notable projects first.
 */
export const OSS_PROJECTS: OssProject[] = [
  {
    name: "agent-lens",
    repo: "illumination-k/agent-lens",
    languages: ["Rust"],
    tags: ["coding agent", "static analysis", "CLI"],
    description: {
      ja: "コーディングエージェント向けのシングルバイナリ Rust CLI。各エージェントのフックプロトコルに対応したハンドラーと、重複関数や関数間の依存を調べるコード解析機能をまとめて提供する。",
      en: "A single-binary Rust CLI for coding agents: hook handlers that speak each agent's hook protocol, plus on-demand analyzers for questions like which functions duplicate each other and how tangled the code is.",
      es: "CLI de Rust en un único binario para agentes de programación: manejadores de hooks compatibles con el protocolo de cada agente y analizadores de código bajo demanda (funciones duplicadas, acoplamiento, etc.).",
    },
    homepage: "https://illumination-k.github.io/agent-lens/",
  },
  {
    name: "mutrim",
    repo: "illumination-k/mutrim",
    languages: ["Go", "Starlark"],
    tags: ["mutation testing", "Bazel", "testing"],
    description: {
      ja: "Bazel ネイティブな Go 向けミューテーションテストツール。その結果を使ってテストスイートの最小化も行う(pre-alpha)。",
      en: "Bazel-native mutation testing for Go that also uses the results to minimize test suites (pre-alpha).",
      es: "Pruebas de mutación nativas de Bazel para Go que también usan los resultados para minimizar las suites de pruebas (pre-alfa).",
    },
    homepage: "https://illumination-k.github.io/mutrim/",
  },
  {
    name: "pubmed-client",
    repo: "illumination-k/pubmed-client",
    languages: ["Rust", "TypeScript", "Python"],
    tags: ["bioinformatics", "PubMed", "MCP", "WebAssembly"],
    description: {
      ja: "Rust / Node.js / WebAssembly / Python から使える型安全な PubMed・PMC API クライアント。検索ビルダー、PMC 全文の構造化取得と Markdown 変換、レートリミット、キャッシュ、MCP サーバーを備える。",
      en: "Type-safe PubMed & PMC API client for Rust, Node.js, WebAssembly, and Python, with a search builder, structured PMC full-text retrieval and Markdown export, rate limiting, caching, and an MCP server.",
      es: "Cliente tipado de las API de PubMed y PMC para Rust, Node.js, WebAssembly y Python, con constructor de búsquedas, obtención estructurada de texto completo de PMC y exportación a Markdown, limitación de tasa, caché y un servidor MCP.",
    },
    packages: [
      { label: "crates.io", url: "https://crates.io/crates/pubmed-client" },
      { label: "npm", url: "https://www.npmjs.com/package/pubmed-client" },
      { label: "PyPI", url: "https://pypi.org/project/pubmed-client-py/" },
    ],
  },
];

export function githubUrl(project: Pick<OssProject, "repo">): string {
  return `https://github.com/${project.repo}`;
}
