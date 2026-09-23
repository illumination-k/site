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
    name: "kodama",
    repo: "illumination-k/kodama",
    languages: ["Go"],
    tags: ["Kubernetes", "kubectl plugin", "Claude Code"],
    description: {
      ja: "Kubernetes 上で Claude Code のセッションを管理する kubectl プラグイン。",
      en: "A kubectl plugin for managing Claude Code sessions in Kubernetes.",
      es: "Un plugin de kubectl para gestionar sesiones de Claude Code en Kubernetes.",
    },
  },
  {
    name: "lifescience-mcps",
    repo: "illumination-k/lifescience-mcps",
    languages: ["Python"],
    tags: ["MCP", "bioinformatics"],
    description: {
      ja: "NCBI Entrez・PubMed・PubChem・PubTator3 といったライフサイエンス系 API のための MCP サーバー集。",
      en: "A collection of MCP servers for life-science APIs such as NCBI Entrez, PubMed, PubChem, and PubTator3.",
      es: "Colección de servidores MCP para API de ciencias de la vida como NCBI Entrez, PubMed, PubChem y PubTator3.",
    },
  },
  {
    name: "entra-helper",
    repo: "illumination-k/entra-helper",
    languages: ["Go"],
    tags: ["CLI", "Microsoft Entra ID", "OAuth2"],
    description: {
      ja: "Microsoft Entra ID で認証してアクセストークンを標準出力に出す小さな CLI。interactive / device code / DefaultAzureCredential の 3 フローに対応し、トークンを OS のキーチェーンに保存する。",
      en: "A small single-binary CLI that authenticates against Microsoft Entra ID and prints an OAuth2 access token. Supports interactive, device code, and DefaultAzureCredential flows and persists tokens in the OS keychain.",
      es: "CLI pequeña en un único binario que se autentica en Microsoft Entra ID e imprime un token de acceso OAuth2. Admite los flujos interactivo, device code y DefaultAzureCredential, y guarda los tokens en el llavero del sistema.",
    },
  },
  {
    name: "google-slides-mcp",
    repo: "illumination-k/google-slides-mcp",
    languages: ["Go"],
    tags: ["MCP", "Google Slides"],
    description: {
      ja: "Google Slides のプレゼンテーション情報を取得する最小構成の MCP サーバー(stdio)。",
      en: "A minimal MCP server (stdio transport) that fetches Google Slides presentation metadata.",
      es: "Servidor MCP mínimo (transporte stdio) que obtiene metadatos de presentaciones de Google Slides.",
    },
  },
  {
    name: "burn-nano-gpt",
    repo: "illumination-k/burn-nano-gpt",
    languages: ["Rust"],
    tags: ["deep learning", "burn", "GPT"],
    description: {
      ja: "Rust 製の深層学習フレームワーク burn で Karpathy の nanoGPT を再実装した学習用リポジトリ。",
      en: "A learning project that rebuilds Karpathy's nanoGPT with burn, a deep learning framework written in Rust.",
      es: "Proyecto de aprendizaje que reimplementa nanoGPT de Karpathy con burn, un framework de deep learning escrito en Rust.",
    },
  },
  {
    name: "site",
    repo: "illumination-k/site",
    languages: ["TypeScript"],
    tags: ["Next.js", "blog"],
    description: {
      ja: "このサイト(illumination-k.dev)のソースコード。Markdown の記事を独自 CLI で変換し、Next.js で静的サイトとして配信している。",
      en: "Source code of this site (illumination-k.dev). Markdown posts are compiled by a custom CLI and served as a static Next.js export.",
      es: "Código fuente de este sitio (illumination-k.dev). Los artículos en Markdown se compilan con una CLI propia y se sirven como exportación estática de Next.js.",
    },
  },
];

export function githubUrl(project: Pick<OssProject, "repo">): string {
  return `https://github.com/${project.repo}`;
}
