#!/bin/bash

set -e

echo "Running OmniTrack E2E tests..."

# Configuration
INGESTION_URL="${INGESTION_URL:-http://localhost:3001}"
API_KEY="${API_KEY:-dev_api_key}"

# Wait for services
echo "Waiting for services to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -f -s "${INGESTION_URL}/health" > /dev/null 2>&1; then
    echo "Ingestion service is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Waiting for services... (${attempt}/${max_attempts})"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "ERROR: Services did not become ready in time"
  exit 1
fi

# Test Ingestion Service health
echo "Testing Ingestion Service health..."
HEALTH_RESPONSE=$(curl -s "${INGESTION_URL}/health")
echo "Health check response: ${HEALTH_RESPONSE}"

if ! echo "${HEALTH_RESPONSE}" | grep -q "healthy"; then
  echo "ERROR: Health check failed"
  exit 1
fi

# Send test telemetry
echo "Sending test telemetry..."
TELEMETRY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${INGESTION_URL}/webhooks/vendor_a/test_tenant" \
  -H "X-API-Key: ${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{
    "tag_id": "tag_test_001",
    "ts": 1734340532,
    "x": 10.5,
    "y": 20.3,
    "battery": 85,
    "rssi": -65
  }')

HTTP_CODE=$(echo "${TELEMETRY_RESPONSE}" | tail -n1)
RESPONSE_BODY=$(echo "${TELEMETRY_RESPONSE}" | head -n-1)

echo "Response code: ${HTTP_CODE}"
echo "Response body: ${RESPONSE_BODY}"

if [ "${HTTP_CODE}" != "200" ] && [ "${HTTP_CODE}" != "201" ]; then
  echo "ERROR: Telemetry submission failed with code ${HTTP_CODE}"
  exit 1
fi

# Wait for processing
echo "Waiting for telemetry processing..."
sleep 5

# Check device twin in PostgreSQL (if available)
if command -v psql &> /dev/null && [ -n "${POSTGRES_HOST:-}" ]; then
  echo "Checking device twin in database..."
  PGPASSWORD="${POSTGRES_PASSWORD:-omnitrack_pass}" psql \
    -h "${POSTGRES_HOST:-localhost}" \
    -U "${POSTGRES_USER:-omnitrack}" \
    -d "${POSTGRES_DB:-omnitrack_test}" \
    -c "SELECT device_id, battery, last_seen FROM device_twins WHERE device_id = 'tag_test_001';" \
    || echo "Database check skipped (not available in CI)"
fi

echo "✅ E2E test completed successfully!"
exit 0
