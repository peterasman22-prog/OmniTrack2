-- Initialize PostgreSQL schema for tests

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS device_twins (
    device_id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    asset_id VARCHAR(255),
    asset_type VARCHAR(100),
    venue_id VARCHAR(255),
    level_id VARCHAR(255),
    last_seen TIMESTAMP,
    battery INTEGER,
    signal_strength INTEGER,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_twins_tenant ON device_twins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_twins_asset ON device_twins(asset_id);
CREATE INDEX IF NOT EXISTS idx_device_twins_last_seen ON device_twins(last_seen);
