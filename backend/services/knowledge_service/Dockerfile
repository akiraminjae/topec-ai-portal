FROM python:3.11-slim
WORKDIR /app
# chroma-hnswlib(chromadb 의존성)는 PyPI에 소스로만 배포되어 빌드 시 C++ 컴파일러가 필요합니다.
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8102
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8102"]
