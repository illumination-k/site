export type FetchResponseType = "json" | "text" | "arraybuffer";

export type FetchOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
  responseType?: FetchResponseType;
};

export type FetchResponse<T = unknown> = {
  data: T;
  status: number;
};

function resolveResponseType(
  contentType: string | null,
  explicit: FetchResponseType | undefined,
): FetchResponseType {
  if (explicit) return explicit;
  if (contentType && /\bjson\b/i.test(contentType)) return "json";
  return "text";
}

async function readBody(
  response: Response,
  type: FetchResponseType,
): Promise<unknown> {
  switch (type) {
    case "json":
      return await response.json();
    case "arraybuffer":
      return await response.arrayBuffer();
    default:
      return await response.text();
  }
}

export async function fetchWithRetry<T = unknown>(
  url: string,
  config?: FetchOptions,
  maxRetries = 3,
): Promise<FetchResponse<T>> {
  const timeoutMs = config?.timeoutMs ?? 30_000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: config?.headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}: ${url}`,
        );
      }

      const resolvedType = resolveResponseType(
        response.headers.get("content-type"),
        config?.responseType,
      );
      const data = (await readBody(response, resolvedType)) as T;
      return { data, status: response.status };
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      const delay = 1000 * 2 ** attempt;
      console.warn(
        `[fetchWithRetry] Retrying ${url} (attempt ${attempt + 1}/${maxRetries}, wait ${delay}ms)`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}
