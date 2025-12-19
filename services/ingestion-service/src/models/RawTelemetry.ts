export interface RawTelemetry {
  tenantId: string;
  vendorId: string;
  deviceId: string;
  timestamp: string; // ISO 8601
  payload: Record<string, any>;
  receivedAt: string; // ISO 8601
}

export interface NormalizedTelemetry {
  tenantId: string;
  deviceId: string;
  timestamp: string;
  x?: number;
  y?: number;
  z?: number;
  floorId?: string;
  accuracy?: number;
  metadata?: Record<string, any>;
}
