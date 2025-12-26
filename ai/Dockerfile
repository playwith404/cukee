# PyTorch 공식 이미지 사용 (CUDA 12.8 지원)
# T4 GPU는 CUDA 12.8 호환
FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY app/ ./app/

# 환경 변수 파일 복사
COPY .env .

# 포트 노출
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Uvicorn 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]
