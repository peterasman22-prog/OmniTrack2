#!/bin/sh
set -e
echo "=== OmniTrack API Gateway Starting ==="

echo "Resolving any failed migrations..."
npx prisma migrate resolve --rolled-back 20260409000000_init 2>/dev/null || true

echo "Running Prisma migrations..."
npx prisma migrate deploy 2>&1 || {
  echo "migrate deploy failed, trying db push..."
  npx prisma db push --accept-data-loss 2>&1
}

echo "Starting API Gateway server..."
exec node dist/server.js
