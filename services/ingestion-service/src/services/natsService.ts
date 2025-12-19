import { connect, NatsConnection, StringCodec } from 'nats';
import { config } from '../config';
import { logger } from '../utils/logger';
import { RawTelemetry } from '../models/RawTelemetry';

class NatsService {
  private nc: NatsConnection | null = null;
  private sc = StringCodec();

  async connect(): Promise<void> {
    try {
      this.nc = await connect({ servers: config.nats.url });
      logger.info('Connected to NATS', { url: config.nats.url });
    } catch (error) {
      logger.error('Failed to connect to NATS', { error });
      throw error;
    }
  }

  async publish(topic: string, data: RawTelemetry): Promise<void> {
    if (!this.nc) {
      throw new Error('NATS connection not established');
    }

    try {
      const payload = this.sc.encode(JSON.stringify(data));
      await this.nc.publish(topic, payload);
      logger.debug('Published message to NATS', { topic, deviceId: data.deviceId });
    } catch (error) {
      logger.error('Failed to publish to NATS', { topic, error });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.nc) {
      await this.nc.close();
      logger.info('NATS connection closed');
    }
  }

  isConnected(): boolean {
    return this.nc !== null && !this.nc.isClosed();
  }
}

export const natsService = new NatsService();
