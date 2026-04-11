import pino from "pino";

// Use a sync destination so log lines are flushed immediately to stderr/stdout.
// The previous pino-pretty transport spawned a worker thread, so any time the
// main process exited before the worker flushed (e.g. during dump compile
// failures in CI), log output was silently lost.
export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
  },
  pino.destination({ sync: true }),
);
