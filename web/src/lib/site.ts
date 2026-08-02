/**
 * Canonical origin of the site.
 *
 * This must match the hostname Cloudflare Pages actually serves. The `www.`
 * variant is not attached to the Pages project and 404s on every path, so
 * advertising it in the sitemap, robots.txt, canonical metadata or JSON-LD
 * makes crawlers drop the site from their index.
 *
 * Keep `web/public/robots.txt` in sync with this value.
 */
export const SITE_URL = "https://illumination-k.dev";
