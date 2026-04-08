import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { Calendar, Download, RefreshCw, BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useAssetStore } from '@/store/useAssetStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useVenueStore } from '@/store/useVenueStore';
import api from '@/services/api';
import StatCard from '@/components/common/StatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

interface TelemetryEvent {
  id: string;
  deviceId: string;
  tenantId: string;
  vendorId?: string;
  rawPayload: any;
  normalizedPayload?: any;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  floorId?: string;
  accuracy?: number;
  processedAt: string;
  createdAt: string;
}

export default function Reports() {
  const { assets, fetchAssets } = useAssetStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const { fetchVenues } = useVenueStore();
  const [telemetryData, setTelemetryData] = useState<TelemetryEvent[]>([]);
  const [telemetryStats, setTelemetryStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: getDefaultStart(), end: getDefaultEnd() });

  function getDefaultStart() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }
  function getDefaultEnd() {
    return new Date().toISOString().slice(0, 10);
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchAssets(), fetchAlerts(), fetchVenues()]);
      // Fetch telemetry data
      const [telRes, statsRes] = await Promise.all([
        api.get('/telemetry', {
          params: { startTime: dateRange.start, endTime: dateRange.end, limit: 200 },
        }).catch(() => ({ data: { data: [] } })),
        api.get('/telemetry/stats').catch(() => ({ data: {} })),
      ]);
      setTelemetryData(telRes.data?.data || telRes.data || []);
      setTelemetryStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load report data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data derivations
  const assetsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const alertsBySeverity = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((a) => { counts[a.severity] = (counts[a.severity] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const alertsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  // Simulate time-series from telemetry
  const telemetryTimeSeries = useMemo(() => {
    const buckets: Record<string, number> = {};
    const events = Array.isArray(telemetryData) ? telemetryData : [];
    events.forEach((t) => {
      const date = new Date(t.createdAt || t.processedAt).toISOString().slice(0, 10);
      buckets[date] = (buckets[date] || 0) + 1;
    });
    // Fill in dates
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, events: buckets[key] || 0 });
    }
    return result;
  }, [telemetryData, dateRange]);

  // Battery distribution
  const batteryDistribution = useMemo(() => {
    const ranges = [
      { name: '0-20%', min: 0, max: 20, count: 0 },
      { name: '21-50%', min: 21, max: 50, count: 0 },
      { name: '51-80%', min: 51, max: 80, count: 0 },
      { name: '81-100%', min: 81, max: 100, count: 0 },
    ];
    assets.forEach((a) => {
      if (a.battery != null) {
        const r = ranges.find((r) => a.battery! >= r.min && a.battery! <= r.max);
        if (r) r.count++;
      }
    });
    return ranges.map((r) => ({ name: r.name, count: r.count }));
  }, [assets]);

  const handleExportCSV = () => {
    const headers = ['Asset Name', 'Type', 'Status', 'Device ID', 'Battery', 'Last Seen'];
    const rows = assets.map((a) => [
      a.name, a.type, a.status, a.deviceId,
      a.battery != null ? `${a.battery}%` : 'N/A',
      a.lastSeen || a.updatedAt,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnitrack-report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="input w-auto text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="input w-auto text-sm"
          />
        </div>
        <button onClick={loadData} className="btn-secondary text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
        <button onClick={handleExportCSV} className="btn-primary text-sm ml-auto">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Assets" value={assets.length} icon={BarChart3} color="blue" />
        <StatCard title="Telemetry Events" value={telemetryStats?.totalEvents || telemetryData.length} icon={Activity} color="green" />
        <StatCard title="Total Alerts" value={alerts.length} icon={TrendingUp} color="amber" />
        <StatCard title="Unique Devices" value={telemetryStats?.uniqueDevices || new Set(assets.map((a) => a.deviceId)).size} icon={PieChartIcon} color="purple" />
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Telemetry Time Series */}
        <div className="card card-body">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Telemetry Events Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={telemetryTimeSeries}>
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="events" stroke="#3b82f6" fill="url(#colorEvents)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assets by Type */}
        <div className="card card-body">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Assets by Type</h3>
          {assetsByType.length === 0 ? (
            <EmptyState title="No asset data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={assetsByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {assetsByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alerts by Severity */}
        <div className="card card-body">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Alerts by Severity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={alertsBySeverity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {alertsBySeverity.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === 'critical' ? '#ef4444' : entry.name === 'warning' ? '#f59e0b' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Battery Distribution */}
        <div className="card card-body">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Battery Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={batteryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts by Type table */}
      <div className="card">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Alert Breakdown by Type</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {alertsByType.map((row, i) => (
                <tr key={row.name} className="border-b border-gray-50">
                  <td className="px-5 py-3 font-medium capitalize">{row.name}</td>
                  <td className="px-5 py-3">{row.value}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[120px] rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${alerts.length ? (row.value / alerts.length) * 100 : 0}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {alerts.length ? ((row.value / alerts.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {alertsByType.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">No alert data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry History Table */}
      <div className="card">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Telemetry Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(telemetryData) ? telemetryData : []).slice(0, 20).map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs">{t.deviceId}</td>
                  <td className="px-5 py-3">
                    {t.positionX != null ? `(${t.positionX.toFixed(1)}, ${t.positionY?.toFixed(1)})` : 'N/A'}
                  </td>
                  <td className="px-5 py-3">{t.accuracy != null ? `${t.accuracy.toFixed(1)}m` : 'N/A'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {telemetryData.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No telemetry data recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
