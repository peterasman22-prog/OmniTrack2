#!/bin/sh
echo "=== OmniTrack API Gateway Starting ==="

echo "Syncing database schema with Prisma db push..."
npx prisma db push --accept-data-loss 2>&1

echo "Starting API Gateway server..."
exec node dist/server.js
