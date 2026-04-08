import { connect, NatsConnection, StringCodec, Subscription } from 'nats';
import dotenv from 'dotenv';
import { logger } from './logger';
import { normalizePayload } from './normalizer';
import { RawTelemetryEvent, NormalizedTelemetryEvent } from './types';

dotenv.config();

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const TOPIC_RAW = process.env.NATS_TOPIC_RAW || 'telemetry.raw';
const TOPIC_NORMALIZED = process.env.NATS_TOPIC_NORMALIZED || 'telemetry.normalized';

const sc = StringCodec();
let nc: NatsConnection | null = null;
let sub: Subscription | null = null;

async function start(): Promise<void> {
  try {
    nc = await connect({ servers: NATS_URL });
    logger.info('Connected to NATS', { server: NATS_URL });

    sub = nc.subscribe(TOPIC_RAW);
    logger.info('Subscribed to raw telemetry', { topic: TOPIC_RAW });

    let processedCount = 0;
    let errorCount = 0;

    for await (const msg of sub) {
      try {
        const raw: RawTelemetryEvent = JSON.parse(sc.decode(msg.data));
        logger.debug('Received raw telemetry', {
          deviceId: raw.deviceId,
          vendorId: raw.vendorId,
        });

        const normalized = normalizePayload(raw);

        if (normalized) {
          // Publish normalized event back to NATS
          nc.publish(TOPIC_NORMALIZED, sc.encode(JSON.stringify(normalized)));
          processedCount++;

          logger.debug('Published normalized telemetry', {
            deviceId: normalized.deviceId,
            x: normalized.x,
            y: normalized.y,
          });

          if (processedCount % 100 === 0) {
            logger.info('Normalization stats', { processed: processedCount, errors: errorCount });
          }
        } else {
          logger.warn('Could not normalize payload', {
            deviceId: raw.deviceId,
            vendorId: raw.vendorId,
          });
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        logger.error('Error processing telemetry', { error: (error as Error).message });
      }
    }
  } catch (error) {
    logger.error('Failed to connect to NATS', { error: (error as Error).message });
    setTimeout(start, 5000);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down normalization service...');
  if (sub) sub.unsubscribe();
  if (nc) await nc.drain();
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (sub) sub.unsubscribe();
  if (nc) await nc.drain();
  process.exit(0);
});

logger.info('Starting OmniTrack Normalization Service...');
start();
