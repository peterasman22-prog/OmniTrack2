import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Settings from './pages/Settings';
import { useAuthStore } from './services/useAuthStore';
import { wsService } from './services/websocket';

export default function App() {
  void useAuthStore();

  useEffect(() => {
    // Auto-login for MVP (auth is disabled on backend)
    const autoLogin = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Auto-login with dev credentials
        try {
          await useAuthStore.getState().login('dev@omnitrack.io', 'dev');
        } catch {
          // Set token manually for MVP
          localStorage.setItem('auth_token', 'dev-token-omnitrack');
          useAuthStore.setState({
            user: { id: 'dev-user', email: 'dev@omnitrack.io', name: 'Dev User', role: 'admin', tenantId: 'default-tenant' },
            token: 'dev-token-omnitrack',
            isAuthenticated: true,
          });
          wsService.connect('dev-token-omnitrack');
        }
      } else {
        useAuthStore.setState({
          user: { id: 'dev-user', email: 'dev@omnitrack.io', name: 'Dev User', role: 'admin', tenantId: 'default-tenant' },
          token,
          isAuthenticated: true,
        });
        wsService.connect(token);
      }
    };
    autoLogin();
  }, []);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
