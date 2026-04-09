-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "address" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "map_url" TEXT,
    "min_x" DOUBLE PRECISION,
    "min_y" DOUBLE PRECISION,
    "max_x" DOUBLE PRECISION,
    "max_y" DOUBLE PRECISION,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'area',
    "geometry" JSONB NOT NULL,
    "capacity" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "device_id" TEXT,
    "tenant_id" TEXT NOT NULL,
    "venue_id" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_twins" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "asset_id" TEXT,
    "venue_id" TEXT,
    "floor_id" TEXT,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "z" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "battery" INTEGER,
    "signal_strength" INTEGER,
    "last_seen" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_twins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_events" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "z" DOUBLE PRECISION,
    "floor_id" TEXT,
    "accuracy" DOUBLE PRECISION,
    "raw_payload" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "status" TEXT NOT NULL DEFAULT 'active',
    "asset_id" TEXT,
    "venue_id" TEXT NOT NULL,
    "zone" TEXT,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venues_tenant_id_idx" ON "venues"("tenant_id");

-- CreateIndex
CREATE INDEX "floors_venue_id_idx" ON "floors"("venue_id");

-- CreateIndex
CREATE INDEX "zones_floor_id_idx" ON "zones"("floor_id");

-- CreateIndex
CREATE INDEX "assets_tenant_id_idx" ON "assets"("tenant_id");

-- CreateIndex
CREATE INDEX "assets_device_id_idx" ON "assets"("device_id");

-- CreateIndex
CREATE INDEX "assets_venue_id_idx" ON "assets"("venue_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_twins_device_id_key" ON "device_twins"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_twins_asset_id_key" ON "device_twins"("asset_id");

-- CreateIndex
CREATE INDEX "device_twins_tenant_id_idx" ON "device_twins"("tenant_id");

-- CreateIndex
CREATE INDEX "device_twins_venue_id_idx" ON "device_twins"("venue_id");

-- CreateIndex
CREATE INDEX "device_twins_last_seen_idx" ON "device_twins"("last_seen");

-- CreateIndex
CREATE INDEX "telemetry_events_device_id_timestamp_idx" ON "telemetry_events"("device_id", "timestamp");

-- CreateIndex
CREATE INDEX "telemetry_events_tenant_id_timestamp_idx" ON "telemetry_events"("tenant_id", "timestamp");

-- CreateIndex
CREATE INDEX "telemetry_events_timestamp_idx" ON "telemetry_events"("timestamp");

-- CreateIndex
CREATE INDEX "alerts_venue_id_status_idx" ON "alerts"("venue_id", "status");

-- CreateIndex
CREATE INDEX "alerts_asset_id_idx" ON "alerts"("asset_id");

-- CreateIndex
CREATE INDEX "alerts_triggered_at_idx" ON "alerts"("triggered_at");

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_twins" ADD CONSTRAINT "device_twins_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.7.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
