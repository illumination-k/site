import LRU from "lru-cache";
import type { NextApiResponse } from "next";

// https://zenn.dev/hasehiro0828/articles/8a5212198840cd

type CheckLimitFunc = () => {
  check: (res: NextApiResponse, limit: number, ipAddress: string) => Promise<void>;
};

export const LimitChecker: CheckLimitFunc = () => {
  const tokenCache = new LRU<string, number>({
    max: 500, // Max 500 users per interval
    maxAge: 1000 * 60 * 5, // 5分,
  });

  return {
    check: (res, limit, token): Promise<void> =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || 0;

        const currentUsage = tokenCount + 1;
        tokenCache.set(token, currentUsage);

        const isRateLimited = currentUsage > limit;
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", isRateLimited ? 0 : limit - currentUsage);

        return isRateLimited ? reject("Too Many Requests") : resolve();
      }),
  };
};
