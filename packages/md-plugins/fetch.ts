import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

export async function fetchWithRetry(
  url: string,
  config?: AxiosRequestConfig,
  maxRetries = 3,
): Promise<AxiosResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await axios.get(url, { timeout: 30_000, ...config });
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
