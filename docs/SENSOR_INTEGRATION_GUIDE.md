# OmniTrack Sensor Integration Guide

> **Version:** 1.0 · **Last Updated:** April 2026  
> **Platform:** [Dashboard](https://modest-essence-production-e9fc.up.railway.app) · [API](https://omnitrack2-production.up.railway.app)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Before You Start](#2-before-you-start)
3. [Step-by-Step Integration](#3-step-by-step-integration)
4. [API Documentation](#4-api-documentation)
5. [Data Format Examples](#5-data-format-examples)
6. [Testing Your Integration](#6-testing-your-integration)
7. [Troubleshooting](#7-troubleshooting)
8. [Advanced Topics](#8-advanced-topics)

---

## 1. Introduction

### What Is Sensor Integration?

OmniTrack is a real-time indoor asset tracking platform. Physical sensors (Wi-Fi APs, BLE beacons, UWB tags, etc.) detect the location of tagged assets and send telemetry data to OmniTrack. The platform normalizes, stores, and visualizes this data on a live dashboard.

### Supported Sensor Vendors

| Vendor | `vendorId` Value | Description |
|---|---|---|
| **Cisco DNA Spaces** | `cisco` or `cisco_dna_spaces` | Enterprise Wi-Fi location analytics |
| **Aruba Meridian** | `aruba` or `aruba_meridian` | BLE + Wi-Fi indoor positioning |
| **Ubisense** | `ubisense` (uses generic normalizer) | UWB precision tracking |
| **Generic** | `generic` or any unrecognized value | Any sensor providing X/Y or Lat/Lon coordinates |

> **Tip:** If your vendor isn't listed, use the **generic** format. OmniTrack's generic normalizer understands many common payload shapes.

### Integration Overview

```
┌──────────────┐       POST /v1/telemetry       ┌────────────────────┐
│  Your Sensor │ ──────────────────────────────► │  Ingestion Service │
│  / Gateway   │       (JSON over HTTPS)         │  (Port 3001)       │
└──────────────┘                                 └────────┬───────────┘
                                                          │ NATS: telemetry.raw
                                                          ▼
                                                 ┌────────────────────┐
                                                 │ Normalization Svc  │
                                                 │ (Vendor → Standard)│
                                                 └────────┬───────────┘
                                                          │ NATS: telemetry.normalized
                                                          ▼
                                                 ┌────────────────────┐
                                                 │   API Gateway      │──► PostgreSQL
                                                 │   (Port 4000)      │──► WebSocket → Dashboard
                                                 └────────────────────┘
```

1. Your sensor sends telemetry to the **Ingestion Service**.
2. The **Normalization Service** transforms vendor-specific payloads into a standard format.
3. The **API Gateway** stores the data and pushes real-time updates to the dashboard via WebSocket.

### Prerequisites

- An OmniTrack deployment (self-hosted or the hosted platform)
- Network access from your sensor/gateway to the Ingestion Service endpoint
- A registered **Asset** and (optionally) a **Device Twin** in OmniTrack
- Your sensor's device identifier (MAC address, tag ID, etc.)

---

## 2. Before You Start

### Required Information

Before configuring your sensor, gather the following:

| Item | Example | Where to Find It |
|---|---|---|
| **API Base URL** | `https://omnitrack2-production.up.railway.app` | Your deployment settings |
| **Ingestion URL** | `https://omnitrack2-production.up.railway.app/v1/telemetry` | Same base + `/v1/telemetry` |
| **Tenant ID** | `tenant-001` | Your organization identifier |
| **Vendor ID** | `cisco`, `aruba`, `generic` | See [Supported Vendors](#supported-sensor-vendors) |
| **Device ID** | `AA:BB:CC:DD:EE:FF` | Your sensor tag/device identifier |
| **Venue ID** | UUID from OmniTrack | Created when you add a venue |
| **Floor ID** | UUID from OmniTrack | Created when you add a floor to a venue |

### Creating an Asset in OmniTrack

An **Asset** represents the physical object you're tracking (wheelchair, badge, equipment, etc.). You must create an asset before telemetry data can be meaningfully displayed.

#### Via the Dashboard UI

1. Navigate to the [OmniTrack Dashboard](https://modest-essence-production-e9fc.up.railway.app).
2. Log in with your credentials.
3. Go to **Settings** or use the asset management area.
4. Click **Add Asset** and fill in the required fields.

#### Via the REST API

```bash
curl -X POST https://omnitrack2-production.up.railway.app/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wheelchair #42",
    "type": "equipment",
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "tenantId": "tenant-001",
    "venueId": "your-venue-uuid",
    "status": "active",
    "metadata": {
      "manufacturer": "MedEquip",
      "model": "WC-200"
    }
  }'
```

**Asset Types:** `cart`, `pallet`, `badge`, `equipment`, `other`  
**Asset Status:** `active`, `inactive`, `maintenance`

### Understanding the Data Flow

```
Sensor → Ingestion Service → NATS (raw) → Normalization → NATS (normalized) → API Gateway → DB + WebSocket
```

- **Ingestion Service** validates and accepts telemetry, returning `202 Accepted` immediately.
- Processing is **asynchronous** — the sensor doesn't wait for normalization or storage.
- **WebSocket** clients subscribed to a venue or asset receive position updates in real-time.

---

## 3. Step-by-Step Integration

### Step 1: Register Your Asset

Create the asset in OmniTrack (see [Creating an Asset](#creating-an-asset-in-omnitrack) above). Note the `deviceId` you assign — this must match what your sensor reports.

### Step 2: (Optional) Create a Device Twin

A **Device Twin** is a digital representation of the physical sensor device. It tracks the device's last known state (position, battery, etc.). The system auto-creates device twins on first telemetry, but you can pre-register one:

```bash
curl -X POST https://omnitrack2-production.up.railway.app/api/device-twins \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "tenantId": "tenant-001",
    "vendor": "cisco",
    "assetId": "your-asset-uuid",
    "venueId": "your-venue-uuid",
    "floorId": "your-floor-uuid",
    "metadata": {
      "firmwareVersion": "2.1.0"
    }
  }'
```

### Step 3: Configure Your Physical Sensor

Each vendor has a different configuration method. The key setting is the **webhook/callback URL** where the sensor sends location data.

#### Cisco DNA Spaces

1. Log in to the Cisco DNA Spaces dashboard.
2. Navigate to **Detect & Locate** → **Notifications**.
3. Create a new notification with:
   - **Type:** Location Update
   - **Webhook URL:** `https://omnitrack2-production.up.railway.app/v1/telemetry`
   - **Method:** POST
   - **Format:** JSON
4. Map the device MAC addresses to your OmniTrack device IDs.

#### Aruba Meridian

1. Open the Aruba Meridian Editor.
2. Go to **Integrations** → **Webhooks**.
3. Add a new webhook:
   - **URL:** `https://omnitrack2-production.up.railway.app/v1/telemetry`
   - **Events:** Location updates
   - **Format:** JSON
4. Ensure the MAC address format matches your OmniTrack device ID.

#### Generic / Custom Sensors

For custom sensors or gateways, configure them to send HTTP POST requests to:

```
POST https://omnitrack2-production.up.railway.app/v1/telemetry
```

With the JSON body format described in [Section 5](#5-data-format-examples).

### Step 4: Send Your First Telemetry Event

Test the integration by sending a manual request:

```bash
curl -X POST https://omnitrack2-production.up.railway.app/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "vendorId": "generic",
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "timestamp": "2026-04-09T12:00:00.000Z",
    "payload": {
      "x": 120.5,
      "y": 85.3,
      "floorId": "your-floor-uuid",
      "battery": 92
    }
  }'
```

**Expected Response (202 Accepted):**

```json
{
  "status": "accepted",
  "messageId": "msg_1712678400000_abc123"
}
```

### Step 5: Verify in the Dashboard

1. Open the [OmniTrack Dashboard](https://modest-essence-production-e9fc.up.railway.app).
2. Select your **Venue** and **Floor** from the dropdown.
3. Your asset should appear on the floor plan at the coordinates you sent.
4. The **Asset List** on the right should show the asset with updated position and "last seen" time.

---

## 4. API Documentation

### Base URLs

| Service | URL |
|---|---|
| **Ingestion Service** | `https://omnitrack2-production.up.railway.app` |
| **API Gateway** | `https://omnitrack2-production.up.railway.app/api` |
| **WebSocket** | `wss://omnitrack2-production.up.railway.app` |

### Authentication

Authentication is configured via the `AUTH_ENABLED` environment variable. When enabled, requests must include one of:

| Method | Header | Example |
|---|---|---|
| API Key | `x-api-key` | `x-api-key: your-api-key-here` |
| Bearer Token | `Authorization` | `Authorization: Bearer your-jwt-token` |

> **Note:** In the current MVP deployment, authentication is **disabled** (`AUTH_ENABLED=false`). All endpoints accept unauthenticated requests.

---

### POST `/v1/telemetry` — Single Telemetry Event

Ingest a single telemetry reading from a sensor.

**Request:**

```http
POST /v1/telemetry HTTP/1.1
Host: omnitrack2-production.up.railway.app
Content-Type: application/json

{
  "tenantId": "tenant-001",
  "vendorId": "cisco",
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "mapCoordinate": { "x": 120.5, "y": 85.3, "z": 0 },
    "floorId": "floor-uuid",
    "confidenceFactor": 85,
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "currentlyTracked": true
  }
}
```

**Required Fields:**

| Field | Type | Description |
|---|---|---|
| `tenantId` | `string` | Your organization/tenant identifier |
| `vendorId` | `string` | Sensor vendor (e.g., `cisco`, `aruba`, `generic`) |
| `deviceId` | `string` | Unique device/tag identifier |
| `timestamp` | `string` | ISO 8601 timestamp (e.g., `2026-04-09T12:00:00.000Z`) |
| `payload` | `object` | Vendor-specific location data (see [Section 5](#5-data-format-examples)) |

**Response (202 Accepted):**

```json
{
  "status": "accepted",
  "messageId": "msg_1712678400000_a1b2c3"
}
```

**Error Responses:**

| Code | Description | Example |
|---|---|---|
| `400` | Validation error | `{ "error": "Validation failed", "details": "\"tenantId\" is required" }` |
| `429` | Rate limit exceeded | `{ "error": "Too many requests" }` |
| `500` | Internal server error | `{ "error": "Internal server error" }` |

---

### POST `/v1/telemetry/batch` — Batch Telemetry Events

Ingest multiple telemetry readings in a single request.

**Request:**

```http
POST /v1/telemetry/batch HTTP/1.1
Host: omnitrack2-production.up.railway.app
Content-Type: application/json

{
  "items": [
    {
      "tenantId": "tenant-001",
      "vendorId": "cisco",
      "deviceId": "AA:BB:CC:DD:EE:FF",
      "timestamp": "2026-04-09T12:00:00.000Z",
      "payload": {
        "mapCoordinate": { "x": 120.5, "y": 85.3 },
        "floorId": "floor-uuid"
      }
    },
    {
      "tenantId": "tenant-001",
      "vendorId": "cisco",
      "deviceId": "11:22:33:44:55:66",
      "timestamp": "2026-04-09T12:00:01.000Z",
      "payload": {
        "mapCoordinate": { "x": 200.0, "y": 150.7 },
        "floorId": "floor-uuid"
      }
    }
  ]
}
```

**Response (202 Accepted):**

```json
{
  "status": "accepted",
  "processed": 2,
  "failed": 0,
  "errors": []
}
```

**Partial Failure Response (202 Accepted):**

```json
{
  "status": "accepted",
  "processed": 1,
  "failed": 1,
  "errors": [
    { "index": 1, "error": "\"timestamp\" must be a valid ISO 8601 date" }
  ]
}
```

> **Note:** The batch endpoint returns `202` even if some items fail validation. Valid items are still processed. Check the `errors` array for details on failed items.

---

### GET `/api/assets` — List Assets

Retrieve all assets (optionally filtered).

```bash
curl "https://omnitrack2-production.up.railway.app/api/assets?venueId=your-venue-uuid&status=active"
```

### GET `/api/assets/:id/position` — Get Asset Position

Retrieve the latest position for a specific asset.

```bash
curl "https://omnitrack2-production.up.railway.app/api/assets/your-asset-uuid/position"
```

### GET `/api/telemetry` — Query Telemetry History

Retrieve historical telemetry events.

```bash
curl "https://omnitrack2-production.up.railway.app/api/telemetry?deviceId=AA:BB:CC:DD:EE:FF&startTime=2026-04-09T00:00:00Z&endTime=2026-04-09T23:59:59Z&limit=100"
```

### GET `/api/telemetry/stats` — Telemetry Statistics

```bash
curl "https://omnitrack2-production.up.railway.app/api/telemetry/stats"
```

**Response:**

```json
{
  "totalEvents": 15234,
  "uniqueDevices": 42,
  "latestEvent": "2026-04-09T14:30:00.000Z"
}
```

---

## 5. Data Format Examples

Each vendor has a specific payload format. The `payload` field inside the telemetry event is where vendor-specific data goes.

### Cisco DNA Spaces Format

**`vendorId`: `cisco` or `cisco_dna_spaces`**

```json
{
  "tenantId": "tenant-001",
  "vendorId": "cisco",
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "mapCoordinate": {
      "x": 120.5,
      "y": 85.3,
      "z": 0
    },
    "floorId": "floor-uuid-here",
    "confidenceFactor": 85,
    "currentlyTracked": true,
    "ssid": "corporate-wifi",
    "band": "5GHz"
  }
}
```

**Payload Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `mapCoordinate.x` | `number` | ✅ | X coordinate on the floor map |
| `mapCoordinate.y` | `number` | ✅ | Y coordinate on the floor map |
| `mapCoordinate.z` | `number` | No | Z coordinate (height/floor), defaults to 0 |
| `floorId` | `string` | No | Floor identifier in OmniTrack |
| `confidenceFactor` | `number` | No | Location accuracy (0–100), mapped to `accuracy` |
| `macAddress` | `string` | No | Device MAC address (stored in metadata) |
| `currentlyTracked` | `boolean` | No | Whether device is actively tracked |
| `ssid` | `string` | No | Connected Wi-Fi SSID (stored in metadata) |
| `band` | `string` | No | Wi-Fi band, e.g., `"5GHz"` (stored in metadata) |

**Alternate Coordinate Fields:** The normalizer also accepts `x`/`y` or `posX`/`posY` at the top level of the payload as fallbacks.

---

### Aruba Meridian Format

**`vendorId`: `aruba` or `aruba_meridian`**

```json
{
  "tenantId": "tenant-001",
  "vendorId": "aruba",
  "deviceId": "AABBCCDDEEFF",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "mac": "AABBCCDDEEFF",
    "location": {
      "lng": -122.084,
      "lat": 37.422,
      "x": 50.2,
      "y": 30.1
    },
    "floor_id": "floor-1",
    "accuracy": 3.5,
    "battery_level": 85
  }
}
```

**Payload Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `location.x` | `number` | ✅ | X coordinate on the floor map |
| `location.y` | `number` | ✅ | Y coordinate on the floor map |
| `location.lat` | `number` | No | Geographic latitude (stored in metadata) |
| `location.lng` | `number` | No | Geographic longitude (stored in metadata) |
| `floor_id` | `string` | No | Floor identifier |
| `accuracy` | `number` | No | Location accuracy in meters |
| `battery_level` | `number` | No | Battery percentage (0–100) |
| `mac` | `string` | No | Device MAC address (stored in metadata) |

**Alternate Coordinate Fields:** Also accepts `x`/`y` or `pos_x`/`pos_y` at the top level.

---

### Generic X/Y Coordinate Format

**`vendorId`: `generic` (or any unrecognized vendor)**

Use this format for any sensor that provides simple X/Y map coordinates.

```json
{
  "tenantId": "tenant-001",
  "vendorId": "generic",
  "deviceId": "tag-001",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "x": 75.0,
    "y": 42.5,
    "z": 0,
    "floorId": "floor-uuid",
    "accuracy": 2.0,
    "battery": 78
  }
}
```

**Accepted Coordinate Field Names (any of these work):**

| X Coordinate | Y Coordinate | Z Coordinate |
|---|---|---|
| `x` | `y` | `z` |
| `posX` | `posY` | `posZ` |
| `pos_x` | `pos_y` | `pos_z` |
| `position.x` | `position.y` | `position.z` |
| `coordinates.x` | `coordinates.y` | `coordinates.z` |
| `coord_x` | `coord_y` | — |

**Using nested `position` object:**

```json
{
  "tenantId": "tenant-001",
  "vendorId": "generic",
  "deviceId": "tag-002",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "position": {
      "x": 75.0,
      "y": 42.5,
      "z": 1.2
    },
    "floorId": "floor-uuid",
    "accuracy": 1.5,
    "battery": 95
  }
}
```

---

### Generic Lat/Lon (Geographic) Format

If your sensor only provides geographic coordinates (latitude/longitude), the generic normalizer will use them as a fallback when no X/Y values are found.

```json
{
  "tenantId": "tenant-001",
  "vendorId": "generic",
  "deviceId": "gps-tracker-001",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "floor": "ground-floor",
    "accuracy": 5.0
  }
}
```

**Accepted Lat/Lon Field Names:**

| Latitude | Longitude |
|---|---|
| `lat` | `lon` |
| `latitude` | `lng` |
| `position.lat` | `longitude` |
| — | `position.lon` |
| — | `position.lng` |

> **Note:** When using Lat/Lon, longitude is mapped to `x` and latitude is mapped to `y` in the normalized output. The metadata will include `originalFormat: "geo"`.

---

## 6. Testing Your Integration

### Sending Test Data with curl

#### Single Event — Generic Format

```bash
curl -X POST https://omnitrack2-production.up.railway.app/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "vendorId": "generic",
    "deviceId": "test-device-001",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "payload": {
      "x": 150.0,
      "y": 100.0,
      "floorId": "your-floor-uuid",
      "battery": 88
    }
  }'
```

#### Single Event — Cisco Format

```bash
curl -X POST https://omnitrack2-production.up.railway.app/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "vendorId": "cisco",
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "timestamp": "2026-04-09T12:00:00.000Z",
    "payload": {
      "macAddress": "AA:BB:CC:DD:EE:FF",
      "mapCoordinate": { "x": 120.5, "y": 85.3, "z": 0 },
      "floorId": "your-floor-uuid",
      "confidenceFactor": 90,
      "currentlyTracked": true,
      "ssid": "hospital-wifi",
      "band": "5GHz"
    }
  }'
```

#### Batch Event

```bash
curl -X POST https://omnitrack2-production.up.railway.app/v1/telemetry/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "tenantId": "tenant-001",
        "vendorId": "generic",
        "deviceId": "device-A",
        "timestamp": "2026-04-09T12:00:00.000Z",
        "payload": { "x": 50, "y": 25, "battery": 100 }
      },
      {
        "tenantId": "tenant-001",
        "vendorId": "generic",
        "deviceId": "device-B",
        "timestamp": "2026-04-09T12:00:00.000Z",
        "payload": { "x": 200, "y": 150, "battery": 67 }
      }
    ]
  }'
```

### Using Postman

1. **Import** the following as a new request in Postman:
   - **Method:** `POST`
   - **URL:** `https://omnitrack2-production.up.railway.app/v1/telemetry`
   - **Headers:** `Content-Type: application/json`
   - **Body (raw JSON):**

   ```json
   {
     "tenantId": "tenant-001",
     "vendorId": "generic",
     "deviceId": "postman-test-001",
     "timestamp": "2026-04-09T12:00:00.000Z",
     "payload": {
       "x": 100,
       "y": 75,
       "battery": 90
     }
   }
   ```

2. Click **Send** and verify you receive a `202 Accepted` response.
3. Create a **Postman Collection** with requests for both single and batch endpoints for ongoing testing.

### Verifying Data in the Dashboard

1. Open the [OmniTrack Dashboard](https://modest-essence-production-e9fc.up.railway.app).
2. Select the correct **Venue** and **Floor** from the top dropdowns.
3. Look for your asset on the **Floor Plan** — it should appear as a colored dot.
4. Check the **Asset List** panel on the right for updated position and timestamp.
5. Click on the asset to see full details in the **Asset Detail** panel.

### Checking WebSocket Updates

To verify real-time updates are flowing, open your browser's Developer Tools (F12) and run:

```javascript
// Connect to OmniTrack WebSocket
const socket = io('https://omnitrack2-production.up.railway.app');

socket.on('connect', () => {
  console.log('Connected to OmniTrack WebSocket');
  
  // Subscribe to position updates for a specific venue
  socket.emit('subscribe', {
    event: 'position:update',
    venueId: 'your-venue-uuid'
  });
});

socket.on('position:update', (data) => {
  console.log('Position update received:', data);
});

socket.on('alert:new', (data) => {
  console.log('New alert:', data);
});
```

Alternatively, use a WebSocket testing tool like **wscat**:

```bash
npm install -g wscat
# Note: Socket.IO uses its own protocol, so use a Socket.IO client for testing
npx socket.io-client https://omnitrack2-production.up.railway.app
```

---

## 7. Troubleshooting

### Common Issues and Solutions

#### ❌ `400 Bad Request` — Validation Error

**Cause:** Missing or invalid required fields.

**Solution:** Ensure your request includes all required fields:

```json
{
  "tenantId": "string (required)",
  "vendorId": "string (required)",
  "deviceId": "string (required)",
  "timestamp": "ISO 8601 string (required)",
  "payload": "object (required)"
}
```

Common mistakes:
- `timestamp` is not in ISO 8601 format (use `2026-04-09T12:00:00.000Z`)
- `payload` is a string instead of an object
- Missing `tenantId` or `vendorId`

#### ❌ `429 Too Many Requests` — Rate Limited

**Cause:** Exceeding the rate limit (default: 1000 requests per 60 seconds).

**Solution:**
- Reduce request frequency.
- Use the **batch endpoint** (`/v1/telemetry/batch`) to send multiple events in one request.
- Contact your administrator to adjust the rate limit.

#### ❌ Data Not Appearing in Dashboard

**Check these in order:**

1. **Verify the API response** — Did you get `202 Accepted`?
2. **Check the device ID** — Does the `deviceId` in your telemetry match the `deviceId` on the asset?
3. **Check the venue/floor** — Are you viewing the correct venue and floor in the dashboard?
4. **Check coordinates** — Are the X/Y values within the floor plan's coordinate range?
5. **Check the payload format** — Is your vendor-specific payload structured correctly? (See [Section 5](#5-data-format-examples))
6. **Check normalization** — If coordinates are in an unexpected format, the normalizer may return `null` and the event is dropped.

#### ❌ Sensor Can't Reach OmniTrack

**Cause:** Network connectivity issues between your sensor and the ingestion endpoint.

**Solution:**
- Verify the sensor/gateway can reach `https://omnitrack2-production.up.railway.app` (try `curl` or `ping` from the same network).
- Check firewall rules allow outbound HTTPS (port 443).
- If using a self-hosted deployment, ensure the ingestion service port (default: 3001) is exposed.

#### ❌ Coordinates Are Wrong on the Floor Plan

**Cause:** Coordinate system mismatch between your sensor and OmniTrack.

**Solution:**
- OmniTrack uses a simple X/Y coordinate system (pixels/meters on a floor map).
- Ensure your sensor coordinates are in the same unit system as your floor plan.
- If your sensor provides Lat/Lon, they'll be used directly as X/Y values — consider using a coordinate transformation on your gateway.

### How to Check Logs

If you have access to the server:

```bash
# Ingestion Service logs
docker logs omnitrack-ingestion-service --tail 100 -f

# Normalization Service logs
docker logs omnitrack-normalization-service --tail 100 -f

# API Gateway logs
docker logs omnitrack-api-gateway --tail 100 -f
```

Look for:
- `"Telemetry received"` — Ingestion received your data
- `"Published to NATS"` — Data was forwarded for normalization
- `"Normalized telemetry"` — Data was successfully normalized
- `"Cisco/Aruba/Generic payload missing coordinates"` — Normalization failed (bad payload format)

### Health Check Endpoints

Verify services are running:

```bash
# Ingestion Service
curl https://omnitrack2-production.up.railway.app/health

# API Gateway
curl https://omnitrack2-production.up.railway.app/api/health
```

---

## 8. Advanced Topics

### Batch Telemetry Updates

For high-throughput environments (many sensors updating frequently), use the batch endpoint to reduce HTTP overhead:

```bash
curl -X POST https://omnitrack2-production.up.railway.app/v1/telemetry/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "tenantId": "tenant-001",
        "vendorId": "cisco",
        "deviceId": "device-001",
        "timestamp": "2026-04-09T12:00:00.000Z",
        "payload": { "mapCoordinate": { "x": 100, "y": 50 } }
      },
      {
        "tenantId": "tenant-001",
        "vendorId": "cisco",
        "deviceId": "device-002",
        "timestamp": "2026-04-09T12:00:00.000Z",
        "payload": { "mapCoordinate": { "x": 200, "y": 150 } }
      },
      {
        "tenantId": "tenant-001",
        "vendorId": "aruba",
        "deviceId": "device-003",
        "timestamp": "2026-04-09T12:00:00.000Z",
        "payload": { "location": { "x": 75, "y": 30 }, "battery_level": 45 }
      }
    ]
  }'
```

**Best Practices for Batch:**
- Send batches of **50–200 items** per request for optimal throughput.
- The payload size limit is **10 MB** per request.
- Batch accepts **mixed vendors** in the same request.
- Failed items don't block successful ones — check the `errors` array in the response.

### Custom Vendor Formats

If your sensor uses a non-standard payload format, you have two options:

#### Option A: Use a Gateway/Middleware

Transform your sensor's data to the generic OmniTrack format before sending:

```javascript
// Example: Node.js transformation gateway
function transformToOmniTrack(sensorData) {
  return {
    tenantId: 'tenant-001',
    vendorId: 'generic',
    deviceId: sensorData.tag_id,
    timestamp: new Date(sensorData.ts * 1000).toISOString(),
    payload: {
      x: sensorData.loc[0],
      y: sensorData.loc[1],
      z: sensorData.loc[2] || 0,
      floorId: sensorData.zone,
      battery: sensorData.batt,
      accuracy: sensorData.precision
    }
  };
}
```

#### Option B: Contribute a Custom Normalizer

If you're self-hosting OmniTrack, you can add a vendor-specific normalizer:

1. Create a new normalizer in `services/normalization-service/src/normalizer.ts`:

```typescript
const myVendorNormalizer: VendorNormalizer = {
  vendorId: 'my_vendor',
  normalize(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null {
    const p = raw.payload;
    
    // Extract coordinates from your vendor's format
    const x = p.loc?.x ?? p.custom_x;
    const y = p.loc?.y ?? p.custom_y;
    
    if (x === undefined || y === undefined) {
      logger.warn('MyVendor payload missing coordinates', { deviceId: raw.deviceId });
      return null;
    }
    
    return {
      tenantId: raw.tenantId,
      deviceId: raw.deviceId,
      vendorId: raw.vendorId,
      timestamp: raw.timestamp,
      x: parseFloat(String(x)),
      y: parseFloat(String(y)),
      z: 0,
      floorId: p.floor ?? undefined,
      accuracy: p.precision ? parseFloat(String(p.precision)) : undefined,
      battery: p.battery_pct !== undefined ? parseInt(String(p.battery_pct), 10) : undefined,
      metadata: { /* vendor-specific fields */ },
    };
  },
};

// Register in the normalizers Map:
normalizers.set('my_vendor', myVendorNormalizer);
```

2. Rebuild and redeploy the Normalization Service.

### Rate Limiting Considerations

| Setting | Default | Description |
|---|---|---|
| **Window** | 60 seconds | Time window for rate counting |
| **Max Requests** | 1000 per window | Maximum requests allowed per IP |

**Strategies to stay within limits:**

- **Batch requests:** Send 100 events in one batch instead of 100 individual POSTs.
- **Throttle on the sensor/gateway side:** Buffer events and send at regular intervals (e.g., every 5 seconds).
- **Deduplicate:** Don't send an update if the position hasn't changed.

### WebSocket Subscription Events

| Event | Direction | Description |
|---|---|---|
| `subscribe` | Client → Server | Subscribe to updates (`position:update`, `alert:new`) |
| `position:update` | Server → Client | Real-time asset position update |
| `alert:new` | Server → Client | New alert triggered |

**Subscribe payload:**

```json
{
  "event": "position:update",
  "venueId": "venue-uuid",
  "assetId": "asset-uuid"
}
```

**Position update payload:**

```json
{
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "assetId": "asset-uuid",
  "x": 120.5,
  "y": 85.3,
  "z": 0,
  "floorId": "floor-uuid",
  "venueId": "venue-uuid",
  "battery": 92,
  "accuracy": 3.5,
  "timestamp": "2026-04-09T12:00:00.000Z"
}
```

---

## Quick Reference

### Endpoint Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/telemetry` | Ingest single telemetry event |
| `POST` | `/v1/telemetry/batch` | Ingest batch telemetry events |
| `GET` | `/health` | Ingestion service health check |
| `POST` | `/api/assets` | Create a new asset |
| `GET` | `/api/assets` | List all assets |
| `GET` | `/api/assets/:id/position` | Get asset's latest position |
| `POST` | `/api/device-twins` | Create a device twin |
| `GET` | `/api/device-twins` | List device twins |
| `GET` | `/api/telemetry` | Query telemetry history |
| `GET` | `/api/telemetry/stats` | Get telemetry statistics |

### Minimum Viable Payload

The simplest possible telemetry event:

```json
{
  "tenantId": "tenant-001",
  "vendorId": "generic",
  "deviceId": "my-device",
  "timestamp": "2026-04-09T12:00:00.000Z",
  "payload": {
    "x": 100,
    "y": 50
  }
}
```

---

> **Need help?** Check the [User Guide](./USER_GUIDE.md) for dashboard usage, or open an issue on the [OmniTrack GitHub repository](https://github.com/your-org/OmniTrack2).
