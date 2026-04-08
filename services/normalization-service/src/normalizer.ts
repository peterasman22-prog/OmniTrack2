import { RawTelemetryEvent, NormalizedTelemetryEvent } from './types';
import { logger } from './logger';

/**
 * Vendor-specific normalizers.
 * Each normalizer transforms vendor-specific payloads into the standard OmniTrack format.
 */

interface VendorNormalizer {
  vendorId: string;
  normalize(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null;
}

// ─── Cisco DNA Spaces Normalizer ────────────────────────────────────────────────
// Expected payload format from Cisco DNA Spaces:
// {
//   "macAddress": "AA:BB:CC:DD:EE:FF",
//   "mapCoordinate": { "x": 120.5, "y": 85.3, "z": 0 },
//   "floorId": "floor-uuid",
//   "confidenceFactor": 85,
//   "currentlyTracked": true,
//   "ssid": "corporate-wifi",
//   "band": "5GHz"
// }
const ciscoNormalizer: VendorNormalizer = {
  vendorId: 'cisco',
  normalize(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null {
    const p = raw.payload;

    const x = p.mapCoordinate?.x ?? p.x ?? p.posX;
    const y = p.mapCoordinate?.y ?? p.y ?? p.posY;
    const z = p.mapCoordinate?.z ?? p.z ?? 0;

    if (x === undefined || y === undefined) {
      logger.warn('Cisco payload missing coordinates', { deviceId: raw.deviceId });
      return null;
    }

    return {
      tenantId: raw.tenantId,
      deviceId: raw.deviceId,
      vendorId: raw.vendorId,
      timestamp: raw.timestamp,
      x: parseFloat(String(x)),
      y: parseFloat(String(y)),
      z: parseFloat(String(z)),
      floorId: p.floorId || p.floor_id || undefined,
      accuracy: p.confidenceFactor ? parseFloat(String(p.confidenceFactor)) : undefined,
      battery: p.battery !== undefined ? parseInt(String(p.battery), 10) : undefined,
      metadata: {
        macAddress: p.macAddress,
        ssid: p.ssid,
        band: p.band,
        currentlyTracked: p.currentlyTracked,
      },
    };
  },
};

// ─── Aruba Meridian Normalizer ──────────────────────────────────────────────────
// Expected payload format from Aruba Meridian:
// {
//   "mac": "AABBCCDDEEFF",
//   "location": { "lng": -122.084, "lat": 37.422, "x": 50.2, "y": 30.1 },
//   "floor_id": "floor-1",
//   "accuracy": 3.5,
//   "battery_level": 85
// }
const arubaNormalizer: VendorNormalizer = {
  vendorId: 'aruba',
  normalize(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null {
    const p = raw.payload;

    const x = p.location?.x ?? p.x ?? p.pos_x;
    const y = p.location?.y ?? p.y ?? p.pos_y;

    if (x === undefined || y === undefined) {
      logger.warn('Aruba payload missing coordinates', { deviceId: raw.deviceId });
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
      floorId: p.floor_id || p.floorId || undefined,
      accuracy: p.accuracy ? parseFloat(String(p.accuracy)) : undefined,
      battery: p.battery_level !== undefined ? parseInt(String(p.battery_level), 10) : undefined,
      metadata: {
        mac: p.mac,
        lat: p.location?.lat,
        lng: p.location?.lng,
      },
    };
  },
};

// ─── Generic / Fallback Normalizer ──────────────────────────────────────────────
// Attempts to extract coordinates from common field names
const genericNormalizer: VendorNormalizer = {
  vendorId: 'generic',
  normalize(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null {
    const p = raw.payload;

    // Try various common field names
    const x = p.x ?? p.posX ?? p.pos_x ?? p.position?.x ?? p.coordinates?.x ?? p.coord_x;
    const y = p.y ?? p.posY ?? p.pos_y ?? p.position?.y ?? p.coordinates?.y ?? p.coord_y;
    const z = p.z ?? p.posZ ?? p.pos_z ?? p.position?.z ?? p.coordinates?.z ?? 0;

    if (x === undefined || y === undefined) {
      // Last resort: check for lat/lng
      const lat = p.lat ?? p.latitude ?? p.position?.lat;
      const lon = p.lon ?? p.lng ?? p.longitude ?? p.position?.lon ?? p.position?.lng;
      if (lat !== undefined && lon !== undefined) {
        return {
          tenantId: raw.tenantId,
          deviceId: raw.deviceId,
          vendorId: raw.vendorId,
          timestamp: raw.timestamp,
          x: parseFloat(String(lon)),
          y: parseFloat(String(lat)),
          z: 0,
          floorId: p.floorId ?? p.floor_id ?? p.floor ?? undefined,
          accuracy: p.accuracy ? parseFloat(String(p.accuracy)) : undefined,
          metadata: { originalFormat: 'geo', ...p },
        };
      }

      logger.warn('Generic normalizer: no coordinates found', { deviceId: raw.deviceId });
      return null;
    }

    return {
      tenantId: raw.tenantId,
      deviceId: raw.deviceId,
      vendorId: raw.vendorId,
      timestamp: raw.timestamp,
      x: parseFloat(String(x)),
      y: parseFloat(String(y)),
      z: parseFloat(String(z)),
      floorId: p.floorId ?? p.floor_id ?? p.floor ?? undefined,
      accuracy: p.accuracy ? parseFloat(String(p.accuracy)) : undefined,
      battery: p.battery !== undefined ? parseInt(String(p.battery), 10) : undefined,
      metadata: {},
    };
  },
};

// ─── Normalizer Registry ────────────────────────────────────────────────────────
const normalizers: Map<string, VendorNormalizer> = new Map();
normalizers.set('cisco', ciscoNormalizer);
normalizers.set('cisco_dna_spaces', ciscoNormalizer);
normalizers.set('aruba', arubaNormalizer);
normalizers.set('aruba_meridian', arubaNormalizer);
normalizers.set('generic', genericNormalizer);

/**
 * Main normalization entry point.
 * Routes to vendor-specific normalizer or falls back to generic.
 */
export function normalizePayload(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null {
  const vendorKey = raw.vendorId.toLowerCase().replace(/[\s-]/g, '_');
  const normalizer = normalizers.get(vendorKey) || genericNormalizer;

  logger.debug('Using normalizer', { vendor: vendorKey, normalizer: normalizer.vendorId });
  return normalizer.normalize(raw);
}
