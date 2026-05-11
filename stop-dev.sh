#!/bin/bash
# Novel Reader - Stop all dev services
# Usage: bash stop-dev.sh

PID_FILE="$(cd "$(dirname "$0")" && pwd)/.dev-pids"

echo "Stopping novel-reader services..."

if [ -f "$PID_FILE" ]; then
  while IFS= read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      echo "  [OK] Stopped PID $pid"
    else
      echo "  [!] PID $pid not running"
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
else
  # Fallback: kill by process name
  echo "  (no PID file, searching by process name...)"
  pkill -f "spring-boot:run" 2>/dev/null && echo "  [OK] Backend stopped" || echo "  [!] Backend not found"
  pkill -f "vite.*5175" 2>/dev/null && echo "  [OK] H5 stopped" || echo "  [!] H5 not found"
  pkill -f "vite.*5176" 2>/dev/null && echo "  [OK] Admin stopped" || echo "  [!] Admin not found"
fi

echo "Done."
