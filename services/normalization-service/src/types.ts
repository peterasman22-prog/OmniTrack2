export interface RawTelemetryEvent {
  tenantId: string;
  vendorId: string;
  deviceId: string;
  timestamp: string;
  payload: Record<string, any>;
  receivedAt: string;
}

export interface NormalizedTelemetryEvent {
  tenantId: string;
  deviceId: string;
  vendorId: string;
  timestamp: string;
  x?: number;
  y?: number;
  z?: number;
  floorId?: string;
  accuracy?: number;
  battery?: number;
  metadata?: Record<string, any>;
}
