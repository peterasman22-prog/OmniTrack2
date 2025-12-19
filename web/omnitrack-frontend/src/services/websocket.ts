import { io, Socket } from 'socket.io-client';
import type { AssetPosition } from '@/types/asset';
import type { Alert } from '@/types/alert';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
    
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToPositions(venueId: string, callback: (position: AssetPosition) => void) {
    if (!this.socket) return;
    
    this.socket.emit('subscribe:positions', { venueId });
    this.socket.on('position:update', callback);
  }

  unsubscribeFromPositions(venueId: string) {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe:positions', { venueId });
    this.socket.off('position:update');
  }

  subscribeToAlerts(venueId: string, callback: (alert: Alert) => void) {
    if (!this.socket) return;
    
    this.socket.emit('subscribe:alerts', { venueId });
    this.socket.on('alert:new', callback);
  }

  unsubscribeFromAlerts(venueId: string) {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe:alerts', { venueId });
    this.socket.off('alert:new');
  }

  subscribeToAsset(assetId: string, callback: (position: AssetPosition) => void) {
    if (!this.socket) return;
    
    this.socket.emit('subscribe:asset', { assetId });
    this.socket.on(`asset:${assetId}:position`, callback);
  }

  unsubscribeFromAsset(assetId: string) {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe:asset', { assetId });
    this.socket.off(`asset:${assetId}:position`);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
export default wsService;
