import axios from "axios";
import type { Text } from "mdast";
import type { Directives } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import type { Parent } from "unist";
import type { DirectiveTransformer } from ".";

interface GithubRepoMeta {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
}

/**
 * Directive: `::gh-meta[owner/repo]`
 *
 * Fetches GitHub repo metadata (stars, last update) at build time
 * and renders a compact inline element suitable for use in lists and tables.
 *
 * Output HTML:
 * <span class="gh-meta">
 *   <a href="...">owner/repo</a>
 *   <span class="gh-meta-stars">⭐ 1.2k</span>
 *   <span class="gh-meta-updated">updated: 2024-01-01</span>
 * </span>
 */
export class GithubMetaTransformer implements DirectiveTransformer {
  shouldTransform(node: Directives): boolean {
    if (node.type !== "leafDirective" && node.type !== "textDirective")
      return false;
    if (node.name !== "gh-meta") return false;
    return true;
  }

  async transform(
    node: Directives,
    index: number | null | undefined,
    parent: Parent,
  ) {
    const repo = mdastToString(node).trim();

    if (!/^[^/]+\/[^/]+$/.test(repo)) {
      return;
    }

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "md-plugins-gh-meta",
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let meta: GithubRepoMeta;
    try {
      const resp = await axios.get(`https://api.github.com/repos/${repo}`, {
        headers,
      });
      meta = resp.data as GithubRepoMeta;
    } catch (e) {
      console.warn(`[gh-meta] Failed to fetch metadata for ${repo}:`, e);
      return;
    }

    const stars = formatStars(meta.stargazers_count);
    const lastUpdate = formatDate(meta.pushed_at);

    // Build inline structure: <span class="gh-meta"><a>repo</a> <span>⭐ N</span> <span>updated: date</span></span>
    const repoText: Text = { type: "text", value: meta.full_name };
    const linkNode: Parent = {
      type: "gh-meta-link",
      children: [repoText],
      data: {
        hName: "a",
        hProperties: {
          href: meta.html_url,
          className: "gh-meta-repo-name",
        },
      },
    };

    const starsText: Text = { type: "text", value: `⭐ ${stars}` };
    const starsNode: Parent = {
      type: "gh-meta-stars",
      children: [starsText],
      data: {
        hName: "span",
        hProperties: { className: "gh-meta-stars" },
      },
    };

    const updatedText: Text = {
      type: "text",
      value: `updated: ${lastUpdate}`,
    };
    const updatedNode: Parent = {
      type: "gh-meta-updated",
      children: [updatedText],
      data: {
        hName: "span",
        hProperties: { className: "gh-meta-updated" },
      },
    };

    const containerNode: Parent = {
      type: "gh-meta",
      children: [linkNode, starsNode, updatedNode],
      data: {
        hName: "span",
        hProperties: { className: "gh-meta" },
      },
    };

    parent.children[index || 0] = containerNode;
  }
}

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
