import { useState } from 'react';
import clsx from 'clsx';
import { Search, MapPin, Battery, Clock, ChevronRight } from 'lucide-react';
import type { AssetWithPosition } from '@/types/asset';

interface AssetListProps {
  assets: AssetWithPosition[];
  selectedAssetId?: string | null;
  onAssetClick: (asset: AssetWithPosition) => void;
  isLoading?: boolean;
}

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-amber-100 text-amber-700',
};

const statusDot = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  maintenance: 'bg-amber-500',
};

export default function AssetList({ assets, selectedAssetId, onAssetClick, isLoading }: AssetListProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = assets.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.deviceId.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || a.type === filterType;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const formatTime = (ts?: string) => {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="card flex flex-col" style={{ maxHeight: '620px' }}>
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Assets ({filtered.length})</h3>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2 border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select flex-1 text-xs"
          >
            <option value="all">All Types</option>
            <option value="cart">Cart</option>
            <option value="equipment">Equipment</option>
            <option value="badge">Badge</option>
            <option value="pallet">Pallet</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select flex-1 text-xs"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No assets found</div>
        ) : (
          filtered.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onAssetClick(asset)}
              className={clsx(
                'flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                asset.id === selectedAssetId && 'bg-primary-50 hover:bg-primary-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={clsx('h-2 w-2 rounded-full', statusDot[asset.status])} />
                  <span className="text-sm font-medium text-gray-900 truncate">{asset.name}</span>
                  <span className={clsx('badge text-[10px]', statusColors[asset.status])}>
                    {asset.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {asset.position
                      ? `(${asset.position.position.x.toFixed(1)}, ${asset.position.position.y.toFixed(1)})`
                      : 'Unknown'}
                  </span>
                  {asset.battery != null && (
                    <span className={clsx('flex items-center gap-1', asset.battery < 20 ? 'text-red-500' : '')}>
                      <Battery className="h-3 w-3" />
                      {asset.battery}%
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(asset.lastSeen || asset.updatedAt)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
