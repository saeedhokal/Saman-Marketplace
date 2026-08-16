#!/usr/bin/env bash
# Starts the dev server (if not already running), checks the sitemap, then
# kills the server if we started it — even when the check fails.
set -euo pipefail

PORT=5000
STARTED_SERVER=0
SERVER_PID=""

# Guarantee cleanup on any exit (normal, error, or signal)
cleanup() {
  if [ "$STARTED_SERVER" -eq 1 ] && [ -n "$SERVER_PID" ]; then
    echo "[validate-sitemap] stopping server (pid $SERVER_PID)"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if curl -sf "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
  echo "[validate-sitemap] dev server already running on :${PORT}"
else
  echo "[validate-sitemap] starting dev server..."
  NODE_ENV=development npx tsx server/index.ts &
  SERVER_PID=$!
  STARTED_SERVER=1

  # Wait up to 30 s for the server to accept connections
  TRIES=0
  until curl -sf "http://localhost:${PORT}/api/health" > /dev/null 2>&1; do
    TRIES=$((TRIES + 1))
    if [ $TRIES -ge 60 ]; then
      echo "[validate-sitemap] ERROR: server did not start within 30 s"
      exit 1
    fi
    sleep 0.5
  done
  echo "[validate-sitemap] server ready after ~$((TRIES / 2))s"
fi

# Run the actual sitemap check; let its exit code propagate (trap handles cleanup)
npx tsx scripts/check-sitemap.ts "http://localhost:${PORT}"
