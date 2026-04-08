import { useRef, useState } from 'react';
import type { AssetWithPosition } from '@/types/asset';
import type { Zone } from '@/types/venue';

interface FloorPlanViewProps {
  assets: AssetWithPosition[];
  zones: Zone[];
  selectedAssetId?: string | null;
  onAssetClick: (asset: AssetWithPosition) => void;
  floorName?: string;
}

const GRID_SIZE = 600;
const assetColors: Record<string, string> = {
  cart: '#3b82f6',
  equipment: '#8b5cf6',
  badge: '#10b981',
  pallet: '#f59e0b',
  other: '#6b7280',
};

const zoneColors: Record<string, string> = {
  area: 'rgba(59,130,246,0.08)',
  room: 'rgba(139,92,246,0.08)',
  restricted: 'rgba(239,68,68,0.12)',
  parking: 'rgba(245,158,11,0.08)',
  other: 'rgba(107,114,128,0.08)',
};

const zoneBorders: Record<string, string> = {
  area: 'rgba(59,130,246,0.25)',
  room: 'rgba(139,92,246,0.25)',
  restricted: 'rgba(239,68,68,0.35)',
  parking: 'rgba(245,158,11,0.25)',
  other: 'rgba(107,114,128,0.25)',
};

export default function FloorPlanView({ assets, zones, selectedAssetId, onAssetClick, floorName }: FloorPlanViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; asset: AssetWithPosition } | null>(null);

  const toSvgX = (x: number) => (x / 100) * GRID_SIZE;
  const toSvgY = (y: number) => (y / 100) * GRID_SIZE;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Floor Plan</h3>
          {floorName && (
            <span className="badge bg-primary-50 text-primary-700">{floorName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {Object.entries(assetColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-500 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative bg-gray-50 p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          className="w-full rounded-lg border border-gray-200 bg-white"
          style={{ maxHeight: '520px' }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f1f5f9" strokeWidth="0.5" />
            </pattern>
            <pattern id="gridSmall" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#f8fafc" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width={GRID_SIZE} height={GRID_SIZE} fill="url(#gridSmall)" />
          <rect width={GRID_SIZE} height={GRID_SIZE} fill="url(#grid)" />

          {/* Zones */}
          {zones.map((zone) => {
            if (zone.geometry?.type === 'Polygon' && Array.isArray(zone.geometry.coordinates)) {
              const points = (zone.geometry.coordinates as number[][]).map(
                (c) => `${toSvgX(c[0])},${toSvgY(c[1])}`
              ).join(' ');
              return (
                <g key={zone.id}>
                  <polygon
                    points={points}
                    fill={zoneColors[zone.type] || zoneColors.other}
                    stroke={zoneBorders[zone.type] || zoneBorders.other}
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                  />
                  <text
                    x={toSvgX((zone.geometry.coordinates as number[][])[0]?.[0] || 0) + 8}
                    y={toSvgY((zone.geometry.coordinates as number[][])[0]?.[1] || 0) + 16}
                    fontSize="10"
                    fill="#6b7280"
                    fontWeight="500"
                  >
                    {zone.name}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* Assets */}
          {assets.map((asset) => {
            const pos = asset.position?.position;
            if (!pos) return null;
            const cx = toSvgX(pos.x);
            const cy = toSvgY(pos.y);
            const color = assetColors[asset.type] || assetColors.other;
            const isSelected = asset.id === selectedAssetId;

            return (
              <g
                key={asset.id}
                className="cursor-pointer"
                onClick={() => onAssetClick(asset)}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      asset,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Pulse ring for selected */}
                {isSelected && (
                  <circle cx={cx} cy={cy} r="18" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3">
                    <animate attributeName="r" from="14" to="22" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Glow */}
                <circle cx={cx} cy={cy} r="10" fill={color} opacity="0.15" />
                {/* Main dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? '7' : '5.5'}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Label */}
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill={color}
                >
                  {asset.name.length > 12 ? asset.name.slice(0, 12) + '…' : asset.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <p className="font-semibold">{tooltip.asset.name}</p>
            <p className="text-gray-300">Type: {tooltip.asset.type}</p>
            <p className="text-gray-300">
              Position: ({tooltip.asset.position?.position.x.toFixed(1)},{' '}
              {tooltip.asset.position?.position.y.toFixed(1)})
            </p>
            {tooltip.asset.battery != null && (
              <p className="text-gray-300">Battery: {tooltip.asset.battery}%</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
