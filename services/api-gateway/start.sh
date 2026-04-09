#!/bin/sh
echo "=== OmniTrack API Gateway Starting ==="
echo "Database URL host: ${DATABASE_URL%%@*}"
echo "PORT: $PORT"

echo "Pushing database schema..."
npx prisma db push --skip-generate 2>&1
echo "Schema push complete."

echo "Starting server on port ${PORT:-4000}..."
exec node dist/server.js
