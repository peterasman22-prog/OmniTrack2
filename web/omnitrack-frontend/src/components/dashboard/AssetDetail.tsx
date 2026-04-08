import { X, MapPin, Battery, Clock, Tag, Radio, Activity } from 'lucide-react';
import type { AssetWithPosition } from '@/types/asset';
import clsx from 'clsx';

interface AssetDetailProps {
  asset: AssetWithPosition;
  onClose: () => void;
}

export default function AssetDetail({ asset, onClose }: AssetDetailProps) {
  const pos = asset.position;

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Asset Details</h3>
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Name & Status */}
        <div>
          <h4 className="text-base font-bold text-gray-900">{asset.name}</h4>
          <div className="mt-1 flex items-center gap-2">
            <span className={clsx(
              'badge',
              asset.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              asset.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {asset.status}
            </span>
            <span className="badge bg-gray-100 text-gray-600 capitalize">{asset.type}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon={Tag} label="Device ID" value={asset.deviceId} />
          <InfoItem icon={Radio} label="Venue" value={asset.venueName || 'Unknown'} />
          {pos && (
            <>
              <InfoItem
                icon={MapPin}
                label="Position"
                value={`(${pos.position.x.toFixed(1)}, ${pos.position.y.toFixed(1)})`}
              />
              <InfoItem icon={Activity} label="Floor" value={pos.floor || 'N/A'} />
            </>
          )}
          {asset.battery != null && (
            <InfoItem
              icon={Battery}
              label="Battery"
              value={`${asset.battery}%`}
              color={asset.battery < 20 ? 'text-red-600' : undefined}
            />
          )}
          <InfoItem
            icon={Clock}
            label="Last Seen"
            value={asset.lastSeen ? new Date(asset.lastSeen).toLocaleString() : 'N/A'}
          />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-gray-400 shrink-0" />
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={clsx('text-xs font-medium text-gray-900', color)}>{value}</p>
      </div>
    </div>
  );
}
