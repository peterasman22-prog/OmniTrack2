import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Filter, XCircle, Info, Bell } from 'lucide-react';
import { useAlertStore } from '@/store/useAlertStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const severityConfig = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  critical: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
};

const statusConfig = {
  active: { color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  acknowledged: { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  resolved: { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

export default function Alerts() {
  const { alerts, isLoading, fetchAlerts, acknowledgeAlert, resolveAlert } = useAlertStore();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filtered = alerts.filter((a) => {
    const matchSev = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSev && matchStatus;
  });

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      toast.success('Alert resolved');
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const counts = {
    active: alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  if (isLoading && alerts.length === 0) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card card-body flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.acknowledged}</p>
            <p className="text-xs text-gray-500">Acknowledged</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.resolved}</p>
            <p className="text-xs text-gray-500">Resolved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="select w-auto text-sm">
          <option value="all">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select w-auto text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} alerts</span>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts" description="No alerts match your current filters" />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const sev = severityConfig[alert.severity];
            const stat = statusConfig[alert.status];
            const Icon = sev.icon;
            return (
              <div key={alert.id} className={clsx('card border', sev.border)}>
                <div className="flex items-start gap-4 p-4">
                  <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', sev.bg)}>
                    <Icon className={clsx('h-5 w-5', sev.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{alert.message}</p>
                      <span className={clsx('badge text-[10px]', sev.badge)}>{alert.severity}</span>
                      <span className={clsx('badge text-[10px]', stat.color)}>{alert.status}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      {alert.assetName && <span>Asset: {alert.assetName}</span>}
                      <span>Type: {alert.type}</span>
                      {alert.zone && <span>Zone: {alert.zone}</span>}
                      <span>Triggered: {new Date(alert.triggeredAt).toLocaleString()}</span>
                      {alert.acknowledgedAt && <span>Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}</span>}
                      {alert.resolvedAt && <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  {alert.status !== 'resolved' && (
                    <div className="flex shrink-0 gap-2">
                      {alert.status === 'active' && (
                        <button onClick={() => handleAcknowledge(alert.id)} className="btn-secondary text-xs py-1.5 px-3">
                          Acknowledge
                        </button>
                      )}
                      <button onClick={() => handleResolve(alert.id)} className="btn-primary text-xs py-1.5 px-3">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
