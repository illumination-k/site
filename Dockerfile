FROM node:16-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat vips fftw

WORKDIR /app

COPY . .

RUN yarn global add pnpm && \
    pnpm i && \
    pnpm cli:build && \
    pnpm cli dump --mdDir ./posts/techblog \
        --imageDist ./packages/web/public/techblog \
        -o ./packages/web/dump/techblog.json && \
    pnpm run --filter web build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder /app/packages/web/next.config.js ./packages/web/next.config.js

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs \
    /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs \
    /app/packages/web/.next/static ./packages/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]