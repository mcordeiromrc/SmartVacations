# Build frontend (React + Vite)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# Backend runtime (FastAPI + Python)
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app/backend

# System deps (CBC solver for PuLP)
RUN apt-get update && apt-get install -y --no-install-recommends coinor-cbc && rm -rf /var/lib/apt/lists/*

# Copy backend source
COPY backend /app/backend

# Copy built frontend to a known static dir
COPY --from=frontend-build /app/dist /app/frontend/dist

# Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Configure FastAPI to serve static frontend
ENV FASTAPI_STATIC_DIR=/app/frontend/dist

EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]

