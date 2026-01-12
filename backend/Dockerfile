# Python 3.10 슬림 버전 사용
FROM python:3.10-slim

WORKDIR /app

# ffmpeg 설치 (pydub에서 오디오 처리에 필요)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# PyAnimalese 음성 파일 다운로드 및 설정
RUN git clone --depth 1 https://github.com/hwi-middle/PyAnimalese.git /tmp/pyanimalese \
    && mkdir -p /app/animalese_sources/high \
    && cp /tmp/pyanimalese/sources/*.padata /app/animalese_sources/ \
    && cp /tmp/pyanimalese/sources/high/*.padata /app/animalese_sources/high/ \
    && cd /app/animalese_sources \
    && for f in *.padata; do mv "$f" "${f%.padata}.mp3"; done \
    && cd /app/animalese_sources/high \
    && for f in *.padata; do mv "$f" "${f%.padata}.mp3"; done \
    && rm -rf /tmp/pyanimalese

# 소스 코드 복사
COPY . .

# FastAPI 실행 (uvicorn)
# app.main:app 은 실제 진입점 파일 위치에 맞게 수정하세요.
# 예: app 폴더 안에 main.py가 있고 그 안에 app 객체가 있는 경우
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
