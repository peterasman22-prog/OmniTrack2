export interface DwellAnalytics {
  zoneId: string;
  zoneName: string;
  avgDwellTime: number;
  totalVisits: number;
  uniqueAssets: number;
  peakHour: string;
  date: string;
}

export interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}
