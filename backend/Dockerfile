# Backend Dockerfile for Railway deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create startup script that runs migrations then starts the server
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running database migrations..."\n\
python -m alembic upgrade head\n\
echo "Starting server..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port (Railway sets PORT env var)
EXPOSE 8000

# Run startup script
CMD ["/app/start.sh"]
