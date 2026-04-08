import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createAlertSchema } from '../utils/validation';
import prisma from '../services/database';
import { logger } from '../utils/logger';
import { broadcastAlert } from '../services/websocket';

export class AlertController {
  // GET /api/alerts
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, severity, venueId, limit } = req.query;
      const where: any = {};
      if (status) where.status = status as string;
      if (severity) where.severity = severity as string;
      if (venueId) where.venueId = venueId as string;

      const alerts = await prisma.alert.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, type: true } },
          venue: { select: { id: true, name: true } },
        },
        orderBy: { triggeredAt: 'desc' },
        take: limit ? parseInt(limit as string, 10) : 100,
      });

      // Map to frontend format
      const result = alerts.map((alert) => ({
        ...alert,
        assetName: alert.asset?.name,
      }));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/alerts/:id
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alert = await prisma.alert.findUnique({
        where: { id: req.params.id },
        include: { asset: true, venue: true },
      });

      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      res.json(alert);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/alerts
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = createAlertSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const alert = await prisma.alert.create({
        data: value,
        include: { asset: { select: { name: true } }, venue: { select: { name: true } } },
      });

      // Broadcast alert via WebSocket
      broadcastAlert({ ...alert, assetName: alert.asset?.name });

      logger.info('Alert created', { alertId: alert.id, type: alert.type, severity: alert.severity });
      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/alerts/:id/acknowledge
  async acknowledge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.alert.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Alert not found', 404);
      }

      if (existing.status !== 'active') {
        throw new AppError('Alert is not in active status', 400);
      }

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: req.userId || 'unknown',
        },
      });

      logger.info('Alert acknowledged', { alertId: alert.id });
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/alerts/:id/resolve
  async resolve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.alert.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Alert not found', 404);
      }

      if (existing.status === 'resolved') {
        throw new AppError('Alert is already resolved', 400);
      }

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });

      logger.info('Alert resolved', { alertId: alert.id });
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
