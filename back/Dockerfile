# syntax=docker/dockerfile:1
FROM python:3.11-slim

# Install system dependencies for pgvector
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port FastAPI runs on
EXPOSE 8000

# Set environment variables (optional, for .env support)
ENV PYTHONUNBUFFERED=1

# For .env support, ensure your .env file is copied or environment variables are set in Docker or docker-compose.
# python-dotenv will load .env automatically if present in the working directory.

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 