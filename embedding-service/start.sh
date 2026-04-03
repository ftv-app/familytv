#!/bin/bash
# FamilyTV Embedding Service — startup script
# Usage: ./start.sh

SERVICE_DIR="/home/openclaw/familytv/embedding-service"
LOG_FILE="/tmp/embedding-service.log"
PID_FILE="/tmp/embedding-service.pid"

cd "$SERVICE_DIR" || exit 1

# Activate venv
source .venv/bin/activate

# If already running, restart
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Service already running (PID $OLD_PID). Stop it first with: kill $OLD_PID"
        exit 1
    fi
fi

# Start uvicorn in background
nohup python -m uvicorn src.main:app --host 0.0.0.0 --port 8080 >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo $NEW_PID > "$PID_FILE"
echo "Embedding service started (PID $NEW_PID). Logs: $LOG_FILE"

# Wait briefly and verify
sleep 3
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "Health check OK"
else
    echo "WARNING: health check failed. Check $LOG_FILE"
fi
