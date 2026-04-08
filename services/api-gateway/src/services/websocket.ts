import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';

let io: Server | null = null;

export interface PositionUpdate {
  assetId: string;
  deviceId: string;
  position: {
    x: number;
    y: number;
    z?: number;
    lat?: number;
    lon?: number;
  };
  floor: string;
  zone?: string;
  accuracy?: number;
  timestamp: string;
  velocity?: number;
  heading?: number;
}

export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info('WebSocket client connected', { id: socket.id });

    // Handle venue position subscription
    socket.on('subscribe:positions', ({ venueId }: { venueId: string }) => {
      const room = `venue:${venueId}:positions`;
      socket.join(room);
      logger.debug('Client subscribed to positions', { socketId: socket.id, venueId });
    });

    socket.on('unsubscribe:positions', ({ venueId }: { venueId: string }) => {
      const room = `venue:${venueId}:positions`;
      socket.leave(room);
      logger.debug('Client unsubscribed from positions', { socketId: socket.id, venueId });
    });

    // Handle alert subscription
    socket.on('subscribe:alerts', ({ venueId }: { venueId: string }) => {
      const room = `venue:${venueId}:alerts`;
      socket.join(room);
      logger.debug('Client subscribed to alerts', { socketId: socket.id, venueId });
    });

    socket.on('unsubscribe:alerts', ({ venueId }: { venueId: string }) => {
      const room = `venue:${venueId}:alerts`;
      socket.leave(room);
    });

    // Handle asset-specific subscription
    socket.on('subscribe:asset', ({ assetId }: { assetId: string }) => {
      const room = `asset:${assetId}`;
      socket.join(room);
      logger.debug('Client subscribed to asset', { socketId: socket.id, assetId });
    });

    socket.on('unsubscribe:asset', ({ assetId }: { assetId: string }) => {
      const room = `asset:${assetId}`;
      socket.leave(room);
    });

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', { id: socket.id, reason });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function broadcastPosition(position: PositionUpdate): void {
  if (!io) return;

  // Broadcast to all connected clients (general feed)
  io.emit('position:update', position);

  // Broadcast to asset-specific room
  if (position.assetId) {
    io.to(`asset:${position.assetId}`).emit(`asset:${position.assetId}:position`, position);
  }
}

export function broadcastAlert(alert: any): void {
  if (!io) return;

  // Broadcast to venue-specific alert room
  if (alert.venueId) {
    io.to(`venue:${alert.venueId}:alerts`).emit('alert:new', alert);
  }

  // Broadcast globally
  io.emit('alert:new', alert);
}

export function getIO(): Server | null {
  return io;
}
