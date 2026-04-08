# OmniTrack Backend Services

## Architecture

```
                    ┌─────────────────┐
                    │   Frontend UI   │
                    │   (port 3000)   │
                    └────────┬────────┘
                         │ REST + WebSocket
                    ┌────────┴────────┐
                    │  API Gateway    │
                    │  (port 4000)    │
                    └┬───────┬───────┬┘
                     │       │       │
              ┌─────┴──┐   │   ┌──┴─────┐
              │ Prisma  │   │   │  NATS   │
              │  (DB)   │   │   │ Consumer│
              └────┬────┘   │   └────┬────┘
                   │       │        │
              ┌────┴────┐  │   ┌────┴────┐
              │PostgreSQL│  │   │  NATS    │
              │ +PostGIS │  │   │ Server   │
              └──────────┘  │   └────┬────┘
                           │        │
    ┌──────────────────┴────────┴──────────────┐
    │                                            │
┌───┴─────────────┐         ┌──────────────┴─────┐
│ Ingestion Service │         │ Normalization Service │
│   (port 3001)     │         │  (NATS subscriber)    │
└──────────────────┘         └──────────────────────┘
```

## Services

### 1. API Gateway (`services/api-gateway/`)
The main backend service that serves the frontend application.

- **Port**: 4000
- **Endpoints**:
  - `GET /api/health` - Health check
  - `POST /api/auth/login` - Auth (MVP stub)
  - `GET/POST/PUT/DELETE /api/assets` - Asset CRUD
  - `GET/POST/PUT/DELETE /api/venues` - Venue CRUD
  - `GET/POST/PUT/DELETE /api/device-twins` - Device Twin CRUD
  - `GET/POST /api/alerts` - Alert management
  - `GET /api/telemetry` - Telemetry queries
  - WebSocket (Socket.io) on same port for real-time updates

- **Features**:
  - Prisma ORM with PostgreSQL
  - NATS consumer for telemetry persistence
  - Socket.io WebSocket for real-time position updates
  - Request validation with Joi
  - Rate limiting, CORS, Helmet security

### 2. Ingestion Service (`services/ingestion-service/`)
Receives raw sensor data from vendors and publishes to NATS.

- **Port**: 3001
- **Endpoints**:
  - `POST /api/v1/telemetry` - Single telemetry ingest
  - `POST /api/v1/telemetry/batch` - Batch telemetry ingest

### 3. Normalization Service (`services/normalization-service/`)
Subscribes to raw telemetry from NATS, transforms vendor-specific data to standard format.

- **Supported Vendors**: Cisco DNA Spaces, Aruba Meridian, Generic
- **Pipeline**: `NATS (raw)` → `Normalize` → `NATS (normalized)`

## Quick Start

### With Docker Compose
```bash
# From project root
docker-compose up -d

# Run database migrations
cd services/api-gateway
npx prisma db push

# Seed demo data
npx ts-node prisma/seed.ts
```

### Local Development
```bash
# 1. Start infrastructure
docker-compose up -d postgres nats

# 2. Set up API Gateway
cd services/api-gateway
npm install
cp .env.example .env  # Edit as needed
npx prisma db push    # Create database tables
npx ts-node prisma/seed.ts  # Seed demo data
npm run dev

# 3. Start Ingestion Service (new terminal)
cd services/ingestion-service
npm install
npm run dev

# 4. Start Normalization Service (new terminal)
cd services/normalization-service
npm install
npm run dev
```

## Data Flow

1. **Sensor data** arrives at Ingestion Service (REST API)
2. Ingestion Service publishes to **NATS** (`telemetry.raw`)
3. **Normalization Service** consumes raw data, transforms coordinates
4. Normalized data published to **NATS** (`telemetry.normalized`)
5. **API Gateway NATS consumer** persists to PostgreSQL
6. **WebSocket** broadcasts position updates to connected frontends
7. Frontend queries **REST API** for historical data

## Environment Variables

See `.env.example` in each service directory for configuration options.

## Database

Using **Prisma ORM** with PostgreSQL + PostGIS. Schema defined in:
`services/api-gateway/prisma/schema.prisma`

### Key Models
- **Venue** → Floor → Zone (location hierarchy)
- **Asset** (tracked items: equipment, badges, carts)
- **DeviceTwin** (real-time device state & position)
- **TelemetryEvent** (historical position data)
- **Alert** (geofence, battery, dwell time alerts)
