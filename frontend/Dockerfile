# 1. Base image
FROM node:20-alpine AS base

# 2. Prune stage: web 앱에 필요한 파일만 추출 (모노레포 최적화)
FROM base AS builder
WORKDIR /app
RUN npm install turbo --global
COPY . .
# 'web'은 apps/web의 package.json에 있는 name 속성값이어야 합니다.
RUN turbo prune --scope=web --docker

# 3. Installer stage: 의존성 설치 및 빌드
FROM base AS installer
WORKDIR /app

# Prune 단계에서 추출된 파일 복사
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# pnpm 설치 및 의존성 설치
RUN corepack enable
RUN pnpm install --frozen-lockfile

# 소스 코드 복사 및 빌드
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# 환경 변수 주입 (빌드 타임에 필요한 NEXT_PUBLIC 변수들)
# 실제 값은 docker-compose에서 주입하거나 CI/CD 파이프라인에서 처리 권장
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# ui 패키지는 next.config.js의 transpilePackages 설정을 통해 web 빌드 시 자동으로 함께 컴파일, 그래서 ui 빌드 건너뛰고 web만 단독으로 빌드
RUN npx turbo run build --filter=web

# 4. Runner stage: 실제 실행 (Standalone 모드 활용)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Next.js 보안상 권장되는 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone 빌드 결과물 복사
# apps/web 위치에 주의하세요.
COPY --from=installer /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# Standalone 모드는 server.js로 실행됩니다.
CMD ["node", "apps/web/server.js"]