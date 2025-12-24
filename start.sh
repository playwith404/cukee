#!/bin/bash

# AI Server 검증용 스크립트

set -e

echo "========================================="
echo "  Cukee AI Model API Server"
echo "========================================="

# GPU 확인
echo "Checking GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi
    echo "✓ GPU detected"
else
    echo "⚠ Warning: nvidia-smi not found. GPU may not be available."
fi

# Docker 확인
echo ""
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Error: Docker is not installed"
    exit 1
fi
echo "✓ Docker found: $(docker --version)"

# Docker Compose 확인
echo ""
echo "Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "✗ Error: Docker Compose is not installed"
    exit 1
fi
echo "✓ Docker Compose found: $(docker compose version)"

# NVIDIA Container Toolkit 확인
echo ""
echo "Checking NVIDIA Container Toolkit..."
if docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
    echo "✓ NVIDIA Container Toolkit is working"
else
    echo "⚠ Warning: NVIDIA Container Toolkit may not be properly configured"
fi

# 환경 변수 파일 확인
echo ""
echo "Checking environment file..."
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✓ .env created. Please review and modify if needed."
else
    echo "✓ .env exists"
fi

# 모델 경로 확인
echo ""
echo "Checking model path..."
MODEL_PATH="/home/ubuntu/model/Llama-3.1-8B-Instruct"
if [ -d "$MODEL_PATH" ]; then
    THEME_COUNT=$(find "$MODEL_PATH" -mindepth 1 -maxdepth 1 -type d | wc -l)
    echo "✓ Model path exists: $MODEL_PATH"
    echo "  Found $THEME_COUNT theme directories"
else
    echo "✗ Error: Model path not found: $MODEL_PATH"
    exit 1
fi

# logs 디렉토리 생성
echo ""
echo "Creating logs directory..."
mkdir -p logs
echo "✓ Logs directory ready"

# Docker Compose 실행
echo ""
echo "Starting AI server with Docker Compose..."
echo "========================================="
docker compose up -d --build

echo ""
echo "Waiting for server to start..."
sleep 10

# 상태 확인
echo ""
echo "Checking server status..."
docker compose ps

echo ""
echo "========================================="
echo "  AI Server Started Successfully!"
echo "========================================="
echo ""
echo "Service URL: http://localhost:5000"
echo "Health Check: curl http://localhost:5000/health"
echo "GPU Info: curl http://localhost:5000/gpu-info"
echo "Themes: curl http://localhost:5000/themes"
echo ""
echo "Logs: docker compose logs -f ai-server"
echo "Stop: docker compose down"
echo ""
