import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { natsService } from '../services/natsService';
import { validationService } from '../services/validationService';
import { logger } from '../utils/logger';
import { telemetryReceived, telemetryPublished, telemetryErrors } from '../utils/metrics';
import { config } from '../config';
import { RawTelemetry } from '../models/RawTelemetry';

export class TelemetryController {
  async ingestSingle(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { tenantId, vendorId, deviceId, timestamp, payload } = req.body;

      // Validate input
      const validation = validationService.validateTelemetry({
        tenantId,
        vendorId,
        deviceId,
        timestamp,
        payload,
      });

      if (!validation.valid) {
        telemetryErrors.inc({ vendor: vendorId, tenant_id: tenantId, error_type: 'validation' });
        res.status(400).json({ error: validation.error });
        return;
      }

      const rawTelemetry: RawTelemetry = {
        ...validation.value!,
        receivedAt: new Date().toISOString(),
      };

      // Publish to NATS
      await natsService.publish(config.nats.topicRaw, rawTelemetry);

      // Update metrics
      telemetryReceived.inc({ vendor: vendorId, tenant_id: tenantId });
      telemetryPublished.inc({ vendor: vendorId, tenant_id: tenantId });

      logger.info('Telemetry ingested', {
        tenantId,
        vendorId,
        deviceId,
        duration: Date.now() - startTime,
      });

      res.status(202).json({ status: 'accepted', messageId: `${deviceId}-${Date.now()}` });
    } catch (error) {
      const { tenantId, vendorId } = req.body;
      telemetryErrors.inc({ vendor: vendorId || 'unknown', tenant_id: tenantId || 'unknown', error_type: 'processing' });
      logger.error('Failed to ingest telemetry', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async ingestBatch(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { items } = req.body;

      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Expected array of telemetry items' });
        return;
      }

      // Validate batch
      const validation = validationService.validateBatch(items);

      if (validation.validItems.length === 0) {
        res.status(400).json({ error: 'No valid items in batch', errors: validation.errors });
        return;
      }

      // Publish all valid items
      const publishPromises = validation.validItems.map(async (item) => {
        const rawTelemetry: RawTelemetry = {
          ...item,
          receivedAt: new Date().toISOString(),
        };

        await natsService.publish(config.nats.topicRaw, rawTelemetry);
        
        telemetryReceived.inc({ vendor: item.vendorId, tenant_id: item.tenantId });
        telemetryPublished.inc({ vendor: item.vendorId, tenant_id: item.tenantId });
      });

      await Promise.all(publishPromises);

      logger.info('Batch telemetry ingested', {
        totalItems: items.length,
        validItems: validation.validItems.length,
        invalidItems: validation.errors.length,
        duration: Date.now() - startTime,
      });

      res.status(202).json({
        status: 'accepted',
        processed: validation.validItems.length,
        failed: validation.errors.length,
        errors: validation.errors.length > 0 ? validation.errors : undefined,
      });
    } catch (error) {
      logger.error('Failed to ingest batch telemetry', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const telemetryController = new TelemetryController();
