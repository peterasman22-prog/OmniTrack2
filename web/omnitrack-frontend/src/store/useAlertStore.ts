import { create } from 'zustand';
import type { Alert } from '@/types/alert';
import { alertsApi } from '@/services/api';

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  fetchAlerts: (params?: any) => Promise<void>;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  markAsRead: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchAlerts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await alertsApi.getAll(params);
      const alerts = response.data;
      const unreadCount = alerts.filter(a => a.status === 'active').length;
      set({ alerts, unreadCount, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch alerts', 
        isLoading: false 
      });
    }
  },

  addAlert: (alert) => {
    const { alerts, unreadCount } = get();
    set({ 
      alerts: [alert, ...alerts], 
      unreadCount: unreadCount + 1 
    });
  },

  acknowledgeAlert: async (id) => {
    try {
      await alertsApi.acknowledge(id);
      const { alerts, unreadCount } = get();
      set({ 
        alerts: alerts.map(a => 
          a.id === id ? { ...a, status: 'acknowledged' as const } : a
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to acknowledge alert' });
      throw error;
    }
  },

  resolveAlert: async (id) => {
    try {
      await alertsApi.resolve(id);
      const { alerts, unreadCount } = get();
      const alert = alerts.find(a => a.id === id);
      set({ 
        alerts: alerts.map(a => 
          a.id === id ? { ...a, status: 'resolved' as const } : a
        ),
        unreadCount: alert?.status === 'active' ? Math.max(0, unreadCount - 1) : unreadCount,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to resolve alert' });
      throw error;
    }
  },

  markAsRead: (id) => {
    const { alerts } = get();
    const alert = alerts.find(a => a.id === id);
    if (alert?.status === 'active') {
      set({ unreadCount: Math.max(0, get().unreadCount - 1) });
    }
  },
}));
