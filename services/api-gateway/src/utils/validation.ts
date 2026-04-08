import Joi from 'joi';

// ─── Asset Validation ──────────────────────────────────────────────────────────
export const createAssetSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  type: Joi.string().valid('cart', 'pallet', 'badge', 'equipment', 'other').default('other'),
  deviceId: Joi.string().allow(null, ''),
  tenantId: Joi.string().required(),
  venueId: Joi.string().allow(null, ''),
  metadata: Joi.object().default({}),
  status: Joi.string().valid('active', 'inactive', 'maintenance').default('active'),
});

export const updateAssetSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  type: Joi.string().valid('cart', 'pallet', 'badge', 'equipment', 'other'),
  deviceId: Joi.string().allow(null, ''),
  venueId: Joi.string().allow(null, ''),
  metadata: Joi.object(),
  status: Joi.string().valid('active', 'inactive', 'maintenance'),
}).min(1);

// ─── Venue Validation ──────────────────────────────────────────────────────────
export const createVenueSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  tenantId: Joi.string().required(),
  address: Joi.string().allow(null, ''),
  metadata: Joi.object().default({}),
  floors: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      level: Joi.number().integer().required(),
      mapUrl: Joi.string().allow(null, ''),
      minX: Joi.number().allow(null),
      minY: Joi.number().allow(null),
      maxX: Joi.number().allow(null),
      maxY: Joi.number().allow(null),
    })
  ).default([]),
});

export const updateVenueSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  address: Joi.string().allow(null, ''),
  metadata: Joi.object(),
}).min(1);

// ─── Device Twin Validation ────────────────────────────────────────────────────
export const createDeviceTwinSchema = Joi.object({
  deviceId: Joi.string().required(),
  tenantId: Joi.string().required(),
  vendor: Joi.string().required(),
  assetId: Joi.string().allow(null, ''),
  venueId: Joi.string().allow(null, ''),
  floorId: Joi.string().allow(null, ''),
  metadata: Joi.object().default({}),
});

export const updateDeviceTwinSchema = Joi.object({
  vendor: Joi.string(),
  assetId: Joi.string().allow(null, ''),
  venueId: Joi.string().allow(null, ''),
  floorId: Joi.string().allow(null, ''),
  x: Joi.number().allow(null),
  y: Joi.number().allow(null),
  z: Joi.number().allow(null),
  lat: Joi.number().allow(null),
  lon: Joi.number().allow(null),
  accuracy: Joi.number().allow(null),
  battery: Joi.number().integer().min(0).max(100).allow(null),
  signalStrength: Joi.number().integer().allow(null),
  metadata: Joi.object(),
}).min(1);

// ─── Alert Validation ──────────────────────────────────────────────────────────
export const createAlertSchema = Joi.object({
  type: Joi.string().valid('dwell', 'geofence', 'capacity', 'battery', 'custom').default('custom'),
  severity: Joi.string().valid('info', 'warning', 'critical').default('info'),
  assetId: Joi.string().allow(null, ''),
  venueId: Joi.string().required(),
  zone: Joi.string().allow(null, ''),
  message: Joi.string().required().min(1).max(1000),
  details: Joi.object().default({}),
});

export const updateAlertSchema = Joi.object({
  status: Joi.string().valid('active', 'acknowledged', 'resolved'),
  acknowledgedBy: Joi.string(),
}).min(1);

// ─── Telemetry Query Validation ────────────────────────────────────────────────
export const telemetryQuerySchema = Joi.object({
  deviceId: Joi.string(),
  tenantId: Joi.string(),
  startTime: Joi.date().iso(),
  endTime: Joi.date().iso(),
  limit: Joi.number().integer().min(1).max(10000).default(100),
  offset: Joi.number().integer().min(0).default(0),
});

// ─── Zone Validation ───────────────────────────────────────────────────────────
export const createZoneSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  floorId: Joi.string().required(),
  type: Joi.string().valid('area', 'room', 'restricted', 'parking', 'other').default('area'),
  geometry: Joi.object({
    type: Joi.string().valid('Polygon', 'Point').required(),
    coordinates: Joi.alternatives().try(Joi.array().items(Joi.array().items(Joi.number())), Joi.array().items(Joi.number())).required(),
  }).required(),
  capacity: Joi.number().integer().min(0).allow(null),
  metadata: Joi.object().default({}),
});
