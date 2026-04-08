import { useEffect, useState, useCallback } from 'react';
import { Package, AlertTriangle, Radio, Activity } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';
import { useVenueStore } from '@/store/useVenueStore';
import { useAlertStore } from '@/store/useAlertStore';
import { wsService } from '@/services/websocket';
import FloorPlanView from '@/components/dashboard/FloorPlanView';
import AssetList from '@/components/dashboard/AssetList';
import AssetDetail from '@/components/dashboard/AssetDetail';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCard from '@/components/common/StatCard';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { AssetWithPosition } from '@/types/asset';

export default function Dashboard() {
  const {
    assets, isLoading: assetsLoading, error: assetsError,
    fetchAssets, updatePosition, selectAsset, selectedAsset,
  } = useAssetStore();
  const { venues, selectedVenue, fetchVenues, selectVenue, zones, fetchZones } = useVenueStore();
  const { alerts, fetchAlerts, acknowledgeAlert, resolveAlert, unreadCount } = useAlertStore();
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');

  // Initial data load
  useEffect(() => {
    fetchVenues();
    fetchAlerts();
  }, []);

  // When venues load, select first
  useEffect(() => {
    if (venues.length > 0 && !selectedVenue) {
      selectVenue(venues[0]);
    }
  }, [venues]);

  // When venue selected, fetch assets and zones
  useEffect(() => {
    if (selectedVenue) {
      fetchAssets(selectedVenue.id);
      if (selectedVenue.floors?.length > 0) {
        const firstFloor = selectedVenue.floors[0];
        setSelectedFloorId(firstFloor.id);
        fetchZones(selectedVenue.id, firstFloor.id);
      }
    }
  }, [selectedVenue]);

  // WebSocket subscriptions
  useEffect(() => {
    if (selectedVenue && wsService.isConnected()) {
      wsService.subscribeToPositions(selectedVenue.id, (position) => {
        updatePosition(position);
      });
      wsService.subscribeToAlerts(selectedVenue.id, (alert) => {
        useAlertStore.getState().addAlert(alert);
      });

      return () => {
        wsService.unsubscribeFromPositions(selectedVenue.id);
        wsService.unsubscribeFromAlerts(selectedVenue.id);
      };
    }
  }, [selectedVenue]);

  const handleAssetClick = useCallback((asset: AssetWithPosition) => {
    selectAsset(asset.id === selectedAsset?.id ? null : asset);
  }, [selectedAsset]);

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    if (selectedVenue) {
      fetchZones(selectedVenue.id, floorId);
    }
  };

  const activeAssets = assets.filter((a) => a.status === 'active');
  const currentFloor = selectedVenue?.floors?.find((f) => f.id === selectedFloorId);

  if (assetsLoading && assets.length === 0) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  return (
    <div className="space-y-4">
      {/* Alert ticker */}
      <AlertTicker alerts={alerts} onAcknowledge={acknowledgeAlert} onResolve={resolveAlert} />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Assets" value={assets.length} icon={Package} color="blue" subtitle="Tracked devices" />
        <StatCard title="Active" value={activeAssets.length} icon={Activity} color="green" subtitle="Currently online" />
        <StatCard title="Active Alerts" value={unreadCount} icon={AlertTriangle} color={unreadCount > 0 ? 'red' : 'amber'} subtitle="Requires attention" />
        <StatCard title="Venues" value={venues.length} icon={Radio} color="purple" subtitle="Monitored locations" />
      </div>

      {/* Venue & Floor selector */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedVenue?.id || ''}
          onChange={(e) => {
            const v = venues.find((v) => v.id === e.target.value);
            if (v) selectVenue(v);
          }}
          className="select w-auto text-sm"
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        {selectedVenue?.floors && selectedVenue.floors.length > 0 && (
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            {selectedVenue.floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => handleFloorChange(floor.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  floor.id === selectedFloorId
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Error state */}
      {assetsError && <ErrorMessage message={assetsError} onRetry={() => selectedVenue && fetchAssets(selectedVenue.id)} />}

      {/* Main content: Floor plan + Asset list */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FloorPlanView
            assets={assets}
            zones={zones}
            selectedAssetId={selectedAsset?.id}
            onAssetClick={handleAssetClick}
            floorName={currentFloor?.name}
          />
        </div>

        <div className="space-y-4">
          {selectedAsset ? (
            <AssetDetail asset={selectedAsset} onClose={() => selectAsset(null)} />
          ) : null}
          <AssetList
            assets={assets}
            selectedAssetId={selectedAsset?.id}
            onAssetClick={handleAssetClick}
            isLoading={assetsLoading}
          />
        </div>
      </div>
    </div>
  );
}
