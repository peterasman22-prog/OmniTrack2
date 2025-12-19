import { Registry, Counter, Histogram } from 'prom-client';

export const register = new Registry();

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Telemetry metrics
export const telemetryReceived = new Counter({
  name: 'telemetry_received_total',
  help: 'Total number of telemetry messages received',
  labelNames: ['vendor', 'tenant_id'],
  registers: [register],
});

export const telemetryPublished = new Counter({
  name: 'telemetry_published_total',
  help: 'Total number of telemetry messages published to NATS',
  labelNames: ['vendor', 'tenant_id'],
  registers: [register],
});

export const telemetryErrors = new Counter({
  name: 'telemetry_errors_total',
  help: 'Total number of telemetry processing errors',
  labelNames: ['vendor', 'tenant_id', 'error_type'],
  registers: [register],
});
