import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CACHE_DIR = path.resolve(
  process.env.EMBED_CACHE_DIR || path.join(process.cwd(), ".cache", "embed"),
);

export function getCacheKey(
  url: string,
  extras?: Record<string, string>,
): string {
  const hash = createHash("sha256");
  hash.update(url);
  if (extras) {
    for (const key of Object.keys(extras).sort()) {
      hash.update(`${key}=${extras[key]}`);
    }
  }
  return hash.digest("hex");
}

export async function cacheGet(
  key: string,
  cacheDir = DEFAULT_CACHE_DIR,
): Promise<Buffer | null> {
  try {
    return await readFile(path.join(cacheDir, key));
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  data: Buffer | string,
  cacheDir = DEFAULT_CACHE_DIR,
): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, key), data);
}
