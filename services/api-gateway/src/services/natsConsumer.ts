import { connect, NatsConnection, Subscription, StringCodec } from 'nats';
import { config } from '../config';
import { logger } from '../utils/logger';
import prisma from './database';
import { broadcastPosition } from './websocket';

let nc: NatsConnection | null = null;
let rawSub: Subscription | null = null;
let normalizedSub: Subscription | null = null;
const sc = StringCodec();

export interface RawTelemetryEvent {
  tenantId: string;
  vendorId: string;
  deviceId: string;
  timestamp: string;
  payload: Record<string, any>;
  receivedAt: string;
}

export interface NormalizedTelemetryEvent {
  tenantId: string;
  deviceId: string;
  vendorId: string;
  timestamp: string;
  x?: number;
  y?: number;
  z?: number;
  floorId?: string;
  accuracy?: number;
  metadata?: Record<string, any>;
}

export async function startNatsConsumer(): Promise<void> {
  try {
    nc = await connect({ servers: config.nats.url });
    logger.info('NATS consumer connected', { server: config.nats.url });

    // Subscribe to raw telemetry
    rawSub = nc.subscribe(config.nats.topicRaw);
    logger.info('Subscribed to raw telemetry topic', { topic: config.nats.topicRaw });
    handleRawTelemetry(rawSub);

    // Subscribe to normalized telemetry
    normalizedSub = nc.subscribe(config.nats.topicNormalized);
    logger.info('Subscribed to normalized telemetry topic', { topic: config.nats.topicNormalized });
    handleNormalizedTelemetry(normalizedSub);

  } catch (error) {
    logger.error('Failed to connect NATS consumer', { error: (error as Error).message });
    // Retry connection after delay
    setTimeout(() => startNatsConsumer(), 5000);
  }
}

async function handleRawTelemetry(sub: Subscription): Promise<void> {
  for await (const msg of sub) {
    try {
      const data: RawTelemetryEvent = JSON.parse(sc.decode(msg.data));
      logger.debug('Received raw telemetry', { deviceId: data.deviceId, tenantId: data.tenantId });

      // Store raw telemetry event
      await prisma.telemetryEvent.create({
        data: {
          deviceId: data.deviceId,
          tenantId: data.tenantId,
          vendorId: data.vendorId,
          timestamp: new Date(data.timestamp),
          rawPayload: data.payload,
        },
      });

      // Upsert device twin
      await prisma.deviceTwin.upsert({
        where: { deviceId: data.deviceId },
        update: {
          lastSeen: new Date(data.timestamp),
          vendor: data.vendorId,
          updatedAt: new Date(),
        },
        create: {
          deviceId: data.deviceId,
          tenantId: data.tenantId,
          vendor: data.vendorId,
          lastSeen: new Date(data.timestamp),
        },
      });

    } catch (error) {
      logger.error('Error processing raw telemetry', { error: (error as Error).message });
    }
  }
}

async function handleNormalizedTelemetry(sub: Subscription): Promise<void> {
  for await (const msg of sub) {
    try {
      const data: NormalizedTelemetryEvent = JSON.parse(sc.decode(msg.data));
      logger.debug('Received normalized telemetry', { deviceId: data.deviceId });

      // Update telemetry event with normalized coordinates
      await prisma.telemetryEvent.create({
        data: {
          deviceId: data.deviceId,
          tenantId: data.tenantId,
          vendorId: data.vendorId,
          timestamp: new Date(data.timestamp),
          x: data.x,
          y: data.y,
          z: data.z,
          floorId: data.floorId,
          accuracy: data.accuracy,
          metadata: data.metadata || {},
        },
      });

      // Update device twin with latest position
      const twin = await prisma.deviceTwin.upsert({
        where: { deviceId: data.deviceId },
        update: {
          x: data.x,
          y: data.y,
          z: data.z,
          floorId: data.floorId,
          accuracy: data.accuracy,
          lastSeen: new Date(data.timestamp),
          updatedAt: new Date(),
        },
        create: {
          deviceId: data.deviceId,
          tenantId: data.tenantId,
          vendor: data.vendorId,
          x: data.x,
          y: data.y,
          z: data.z,
          floorId: data.floorId,
          accuracy: data.accuracy,
          lastSeen: new Date(data.timestamp),
        },
      });

      // Broadcast real-time position update via WebSocket
      broadcastPosition({
        assetId: twin.assetId || '',
        deviceId: data.deviceId,
        position: {
          x: data.x || 0,
          y: data.y || 0,
          z: data.z,
          lat: twin.lat || undefined,
          lon: twin.lon || undefined,
        },
        floor: data.floorId || '',
        accuracy: data.accuracy,
        timestamp: data.timestamp,
      });

    } catch (error) {
      logger.error('Error processing normalized telemetry', { error: (error as Error).message });
    }
  }
}

export async function stopNatsConsumer(): Promise<void> {
  if (rawSub) rawSub.unsubscribe();
  if (normalizedSub) normalizedSub.unsubscribe();
  if (nc) {
    await nc.drain();
    logger.info('NATS consumer disconnected');
  }
}
