#!/bin/bash
# Novel Reader - Start all dev services in background
# Usage: bash start-dev.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$ROOT_DIR/.dev-pids"

echo "============================================"
echo " Novel Reader - Starting All Services..."
echo "============================================"
echo

# Clean up old PID file
rm -f "$PID_FILE"

# ---- Backend (Spring Boot :8080) ----
echo "[1/3] Starting Backend (port 8080)..."
cd "$ROOT_DIR/backend"
mvn spring-boot:run -q > /tmp/novel-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> "$PID_FILE"
echo "  PID: $BACKEND_PID  (log: /tmp/novel-backend.log)"

# ---- H5 Frontend (:5175) ----
echo "[2/3] Starting H5 Frontend (port 5175)..."
cd "$ROOT_DIR/frontend"
npm run dev:h5 > /tmp/novel-h5.log 2>&1 &
H5_PID=$!
echo $H5_PID >> "$PID_FILE"
echo "  PID: $H5_PID  (log: /tmp/novel-h5.log)"

# ---- Admin Frontend (:5176) ----
echo "[3/3] Starting Admin Frontend (port 5176)..."
cd "$ROOT_DIR/admin-frontend"
npm run dev > /tmp/novel-admin.log 2>&1 &
ADMIN_PID=$!
echo $ADMIN_PID >> "$PID_FILE"
echo "  PID: $ADMIN_PID  (log: /tmp/novel-admin.log)"

cd "$ROOT_DIR"
echo
echo "All services starting up!"
echo "  Backend :8080  (tail -f /tmp/novel-backend.log)"
echo "  H5      :5175  (tail -f /tmp/novel-h5.log)"
echo "  Admin   :5176  (tail -f /tmp/novel-admin.log)"
echo
echo "Stop all:  bash stop-dev.sh"
echo "Check:     ps aux | grep -E 'spring-boot|vite|node'"
echo "============================================"
