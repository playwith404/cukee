# Cukee AI Model API Server (VM2)

11개 테마의 LoRA 어댑터를 사용한 영화 추천 AI API 서버

## 시스템 요구사항

- **GPU**: NVIDIA T4 (CUDA 12.4 이상)
- **Docker**: Docker 20.10+ with NVIDIA Container Toolkit
- **메모리**: 최소 16GB RAM
- **디스크**: 최소 50GB (모델 캐싱 포함)

## 서버 정보

- **VM2 프라이빗 IP**: 10.0.19.117
- **포트**: 5000
- **베이스 모델**: Llama-3.1-8B-Instruct (4-bit 양자화)
- **LoRA 어댑터**: 11개 테마

## 설치 및 실행

### 1. NVIDIA Container Toolkit 설치 확인

```bash
# Docker에서 GPU 사용 가능한지 확인
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
```

### 2. 환경 변수 설정

```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env

# 필요시 .env 파일 수정
vim .env
```

### 3. Docker Compose로 빌드 및 실행

```bash
# 빌드 및 백그라운드 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f ai-server

# 상태 확인
docker compose ps
```

### 4. 헬스 체크

```bash
# 서버 상태 확인
curl http://localhost:5000/health

# GPU 정보 확인
curl http://localhost:5000/gpu-info

# 로드된 테마 목록 확인
curl http://localhost:5000/themes
```

## API 엔드포인트

### 1. 헬스 체크
```
GET /health
```

### 2. GPU 정보
```
GET /gpu-info
```

### 3. 테마 목록
```
GET /themes
```

### 4. AI 생성 (메인 엔드포인트)
```
POST /api/v1/generate
Content-Type: application/json

{
  "prompt": "감성적이고 잔잔한 영화를 추천해주세요",
  "theme": "편안하고 잔잔한 감성 추구",
  "ticketId": 3,
  "max_length": 2048,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 50
}
```

## 11개 테마 목록

1. 3D 보단 2D 
2. 뇌 빼고도 볼 수 있는 레전드 코미디 
3. 설레고 싶은 날의 로맨스 
4. 세계관 과몰입 판타지러버
5. 숏폼 러버 MZ 스타일
6. 심장 터질 것 같은 액션 범죄 영화
7. 여름에 찰떡인 역대급 호러 
8. 영화덕후의 최애 마이너영화
9. 이거 실화야? 실화야. 
10. 찝찝한 여운의 우울한 명작들
11. 편안하고 잔잔한 감성 추구

## Docker 명령어

```bash
# 컨테이너 중지
docker compose down

# 컨테이너 재시작
docker compose restart

# 로그 실시간 확인
docker compose logs -f

# 컨테이너 내부 접속
docker compose exec ai-server bash

# GPU 사용량 확인
nvidia-smi

# 이미지 재빌드
docker compose build --no-cache
```

## VM1과의 통신

VM1 백엔드에서 VM2 AI 서버 호출:

```python
import requests

# VM2 AI 서버 URL (프라이빗 IP)
AI_SERVER_URL = "http://10.0.19.117:5000"

# AI 생성 요청
response = requests.post(
    f"{AI_SERVER_URL}/api/v1/generate",
    json={
        "prompt": "사용자 프롬프트",
        "theme": "편안하고 잔잔한 감성 추구",
        "ticketId": 123,
        "temperature": 0.7
    }
)

result = response.json()
```

## 트러블슈팅

### GPU 인식 안 됨
```bash
# NVIDIA 드라이버 확인
nvidia-smi

# Docker에서 GPU 테스트
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
```

### 메모리 부족
- Docker에 할당된 메모리 확인
- 불필요한 컨테이너 정리: `docker system prune -a`

### 모델 로딩 실패
- LoRA 어댑터 경로 확인: `/home/ubuntu/model/Llama-3.1-8B-Instruct`
- 각 테마 폴더에 필요한 파일들이 있는지 확인

## 모니터링

```bash
# 컨테이너 리소스 사용량
docker stats cukee-ai-server

# GPU 사용량 실시간 모니터링
watch -n 1 nvidia-smi
```

## 개발 모드

로컬에서 개발하려면:

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

## 라이선스

Cukee Project - VM2 AI Server
""
