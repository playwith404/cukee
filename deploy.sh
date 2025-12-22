#!/bin/bash
set -e # 에러 발생 시 즉시 종료

# 인자 받기
SERVICE_NAME=$1
COMMIT_SHA=$2
DOCKER_USERNAME=$3
DOCKER_TOKEN=$4

# 입력값 검증
if [ -z "$SERVICE_NAME" ] || [ -z "$COMMIT_SHA" ] || [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_TOKEN" ]; then
    echo "Usage: ./deploy.sh <service_name> <commit_sha> <docker_username> <docker_token>"
    exit 1
fi

echo "🚀 Starting deployment for $SERVICE_NAME (SHA: $COMMIT_SHA)..."

# 작업 디렉토리로 이동
cd ~/app

# .env 파일이 없으면 생성 (최초 배포 시)
if [ ! -f .env ]; then
    touch .env
fi

# 서비스별 태그 변수명 매핑
if [ "$SERVICE_NAME" == "frontend" ]; then
    TAG_VAR="FRONTEND_TAG"
elif [ "$SERVICE_NAME" == "backend" ]; then
    TAG_VAR="BACKEND_TAG"
elif [ "$SERVICE_NAME" == "ai" ]; then
    TAG_VAR="AI_TAG"
else
    echo "Unknown service: $SERVICE_NAME"
    exit 1
fi

# 1. .env 파일에 태그 업데이트 (Persist Tag)
# 해당 변수가 이미 있으면 sed로 교체, 없으면 파일 끝에 추가
if grep -q "^$TAG_VAR=" .env; then
    # 리눅스 sed 문법
    sed -i "s/^$TAG_VAR=.*/$TAG_VAR=sha-$COMMIT_SHA/" .env
else
    echo "$TAG_VAR=sha-$COMMIT_SHA" >> .env
fi

# 2. 다른 서비스 태그가 비어있을 경우 대비 (초기 부트스트래핑)
# 처음 배포할 때는 다른 TAG 변수가 아예 없어서 에러가 날 수 있음.
# 임시로 현재 배포하는 SHA로 채워넣어서 에러 방지 (어차피 그 서비스는 지금 배포 안 함)
for v in FRONTEND_TAG BACKEND_TAG AI_TAG; do
    if ! grep -q "^$v=" .env; then
        echo "Initializing missing variable $v..."
        echo "$v=sha-$COMMIT_SHA" >> .env
    fi
done

# Docker Hub 로그인
echo "$DOCKER_TOKEN" | sudo docker login -u "$DOCKER_USERNAME" --password-stdin

# 3. Docker Compose 실행
# 이제 환경변수(IMAGE_TAG)를 주입할 필요 없이, 업데이트된 .env 파일을 자동으로 읽음
echo "📦 Pulling image for $SERVICE_NAME..."
sudo docker compose pull $SERVICE_NAME

echo "🔄 Restarting $SERVICE_NAME..."
# Nginx도 같이 리로드 (설정 변경 가능성 대비)
sudo docker compose up -d --force-recreate $SERVICE_NAME nginx

echo "🧹 Cleaning up unused images..."
sudo docker image prune -f

echo "✅ Deployment successful for $SERVICE_NAME!"
