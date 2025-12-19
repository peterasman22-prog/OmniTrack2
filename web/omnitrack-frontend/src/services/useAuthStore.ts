import { create } from 'zustand';
import { authApi } from '@/services/api';
import { wsService } from '@/services/websocket';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  validateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      wsService.connect(token);
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    wsService.disconnect();
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false 
    });
  },

  validateToken: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      wsService.connect(token);
      set({ 
        user: response.data, 
        token, 
        isAuthenticated: true 
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      });
    }
  },
}));
