# Python 3.10 슬림 버전 사용
FROM python:3.10-slim

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# FastAPI 실행 (uvicorn)
# app.main:app 은 실제 진입점 파일 위치에 맞게 수정하세요.
# 예: app 폴더 안에 main.py가 있고 그 안에 app 객체가 있는 경우
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]