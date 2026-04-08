import clsx from 'clsx';
import { AlertTriangle, Info, XCircle, CheckCircle2 } from 'lucide-react';
import type { Alert } from '@/types/alert';

interface AlertTickerProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

const severityConfig = {
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  critical: { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
};

export default function AlertTicker({ alerts, onAcknowledge, onResolve }: AlertTickerProps) {
  const active = alerts.filter((a) => a.status === 'active').slice(0, 5);

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((alert) => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        return (
          <div
            key={alert.id}
            className={clsx('flex items-center gap-3 rounded-lg border px-4 py-2.5', config.bg)}
          >
            <Icon className={clsx('h-4 w-4 shrink-0', config.text)} />
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium', config.text)}>{alert.message}</p>
              <p className="text-xs text-gray-500">
                {alert.assetName && `${alert.assetName} · `}
                {new Date(alert.triggeredAt).toLocaleString()}
              </p>
            </div>
            <span className={clsx('badge text-[10px]', config.badge)}>{alert.severity}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="rounded px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-white/50"
                title="Acknowledge"
              >
                ACK
              </button>
              <button
                onClick={() => onResolve(alert.id)}
                className="rounded px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-white/50"
                title="Resolve"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
