export type AlertType = 'dwell' | 'geofence' | 'capacity' | 'battery' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  assetId?: string;
  assetName?: string;
  venueId: string;
  zone?: string;
  message: string;
  details?: Record<string, any>;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export interface Rule {
  id: string;
  name: string;
  type: AlertType;
  enabled: boolean;
  conditions: Record<string, any>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  tenantId: string;
  venueId?: string;
  createdAt: string;
  updatedAt: string;
}
