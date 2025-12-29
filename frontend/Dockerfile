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

# 환경 변수 주입 (빌드 타임에 필요한 VITE_ 변수들)
# 실제 값은 docker-compose에서 주입하거나 CI/CD 파이프라인에서 처리 권장
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# ui 패키지는 Vite 빌드 시 자동으로 함께 컴파일, 그래서 ui 빌드 건너뛰고 web만 단독으로 빌드
RUN npx turbo run build --filter=web

# 4. Runner stage: nginx로 정적 파일 서빙
FROM nginx:alpine AS runner

# Vite 빌드 결과물을 nginx로 복사
COPY --from=installer /app/apps/web/dist /usr/share/nginx/html

# nginx 설정 파일 (SPA 라우팅을 위한 설정)
RUN echo $'server {\n\
    listen 3000;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    \n\
    # SPA 라우팅 처리: 모든 요청을 index.html로 전달\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    \n\
    # 정적 파일 캐싱\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]