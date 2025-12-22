#!/bin/bash
set -e # 에러 발생 시 즉시 종료

# 인자 받기
SERVICE_NAME=$1
# Full SHA를 받아서 앞에서 7자리만 사용 (일관성 보장)
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

# Docker Hub 로그인
# (보안을 위해 로그에는 토큰을 출력하지 않음)
echo "$DOCKER_TOKEN" | sudo docker login -u "$DOCKER_USERNAME" --password-stdin

# 이미지 태그 생성 (Full SHA 사용)
# YAML에서 넘어온 값이 Full SHA이므로 그대로 사용
TAG="sha-${COMMIT_SHA}"

echo "📦 Pulling image: $TAG"
# sudo -E: 환경변수 보존
sudo IMAGE_TAG=$TAG docker compose pull $SERVICE_NAME

echo "🔄 Restarting service..."
# --force-recreate: 강제 재생성으로 확실한 업데이트 보장
# -d: 백그라운드 실행
sudo IMAGE_TAG=$TAG docker compose up -d --force-recreate $SERVICE_NAME nginx

# AI 서비스가 아닌 경우 Nginx 재시작 (Frontend/Backend 배포 시 Nginx 갱신 필요할 수 있음)
# if [ "$SERVICE_NAME" != "ai" ]; then
#     echo "🔄 Reloading Nginx..."
#     sudo docker compose exec nginx nginx -s reload || true
# fi

echo "🧹 Cleaning up unused images..."
sudo docker image prune -f

echo "✅ Deployment successful!"
