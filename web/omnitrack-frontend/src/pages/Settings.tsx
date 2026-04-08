import { useState } from 'react';
import { Save, Server, Bell, Globe, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    apiUrl: 'http://localhost:4000',
    wsUrl: 'http://localhost:4000',
    refreshInterval: 5,
    alertNotifications: true,
    soundAlerts: false,
    autoAcknowledge: false,
    darkMode: false,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleSave = () => {
    toast.success('Settings saved (demo mode)');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Connection Settings */}
      <div className="card">
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <Server className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Connection Settings</h3>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="label">API Base URL</label>
            <input type="url" className="input" value={settings.apiUrl} onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })} />
          </div>
          <div>
            <label className="label">WebSocket URL</label>
            <input type="url" className="input" value={settings.wsUrl} onChange={(e) => setSettings({ ...settings, wsUrl: e.target.value })} />
          </div>
          <div>
            <label className="label">Data Refresh Interval (seconds)</label>
            <input type="number" className="input w-32" min={1} max={60} value={settings.refreshInterval} onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card">
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <Bell className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="space-y-4 p-5">
          {[
            { key: 'alertNotifications', label: 'Alert Notifications', desc: 'Show browser notifications for new alerts' },
            { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play sound for critical alerts' },
            { key: 'autoAcknowledge', label: 'Auto-Acknowledge', desc: 'Automatically acknowledge info-level alerts' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [item.key]: !(settings as any)[item.key] })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                  (settings as any)[item.key] ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                  (settings as any)[item.key] ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Localization */}
      <div className="card">
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <Globe className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Localization</h3>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="label">Language</label>
            <select className="select w-48" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="label">Timezone</label>
            <input type="text" className="input" value={settings.timezone} readOnly />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <Database className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">System Information</h3>
        </div>
        <div className="space-y-2 p-5">
          <InfoRow label="Version" value="1.0.0 MVP" />
          <InfoRow label="API Gateway" value="localhost:4000" />
          <InfoRow label="Database" value="PostgreSQL + PostGIS" />
          <InfoRow label="Message Broker" value="NATS" />
          <InfoRow label="Frontend" value="React 18 + Vite + Tailwind" />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
