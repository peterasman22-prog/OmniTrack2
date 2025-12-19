export interface Venue {
  id: string;
  name: string;
  tenantId: string;
  address?: string;
  floors: Floor[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  venueId: string;
  name: string;
  level: number;
  mapUrl?: string;
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  floorId: string;
  type: 'area' | 'room' | 'restricted' | 'parking' | 'other';
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: number[][] | number[];
  };
  capacity?: number;
  metadata?: Record<string, any>;
}

export interface POI {
  id: string;
  name: string;
  category: string;
  venueId: string;
  floorId: string;
  position: {
    x: number;
    y: number;
    lat?: number;
    lon?: number;
  };
  metadata?: Record<string, any>;
}
