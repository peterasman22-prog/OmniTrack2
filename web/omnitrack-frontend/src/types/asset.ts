export interface Asset {
  id: string;
  name: string;
  type: 'cart' | 'pallet' | 'badge' | 'equipment' | 'other';
  deviceId: string;
  tenantId: string;
  venueId: string;
  metadata: Record<string, any>;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface AssetPosition {
  assetId: string;
  deviceId: string;
  position: {
    x: number;
    y: number;
    z?: number;
    lat?: number;
    lon?: number;
  };
  floor: string;
  zone?: string;
  accuracy?: number;
  timestamp: string;
  velocity?: number;
  heading?: number;
}

export interface AssetWithPosition extends Asset {
  position?: AssetPosition;
  battery?: number;
  lastSeen?: string;
}
