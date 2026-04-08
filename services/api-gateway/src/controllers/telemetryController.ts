import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { telemetryQuerySchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import prisma from '../services/database';
import { logger } from '../utils/logger';

export class TelemetryController {
  // GET /api/telemetry
  async query(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = telemetryQuerySchema.validate(req.query);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const { deviceId, tenantId, startTime, endTime, limit, offset } = value;

      const where: any = {};
      if (deviceId) where.deviceId = deviceId;
      if (tenantId) where.tenantId = tenantId;
      if (startTime || endTime) {
        where.timestamp = {};
        if (startTime) where.timestamp.gte = new Date(startTime);
        if (endTime) where.timestamp.lte = new Date(endTime);
      }

      const [events, total] = await Promise.all([
        prisma.telemetryEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.telemetryEvent.count({ where }),
      ]);

      res.json({
        data: events,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/telemetry/latest
  async getLatest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deviceId } = req.query;

      if (!deviceId) {
        throw new AppError('deviceId query parameter is required', 400);
      }

      const event = await prisma.telemetryEvent.findFirst({
        where: { deviceId: deviceId as string },
        orderBy: { timestamp: 'desc' },
      });

      if (!event) {
        throw new AppError('No telemetry found for this device', 404);
      }

      res.json(event);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/telemetry/stats
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.query;
      const where: any = {};
      if (tenantId) where.tenantId = tenantId;

      const [totalEvents, uniqueDevices, latestEvent] = await Promise.all([
        prisma.telemetryEvent.count({ where }),
        prisma.telemetryEvent.groupBy({ by: ['deviceId'], where }).then((g) => g.length),
        prisma.telemetryEvent.findFirst({ where, orderBy: { timestamp: 'desc' }, select: { timestamp: true } }),
      ]);

      res.json({
        totalEvents,
        uniqueDevices,
        latestEventAt: latestEvent?.timestamp?.toISOString() || null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const telemetryController = new TelemetryController();
