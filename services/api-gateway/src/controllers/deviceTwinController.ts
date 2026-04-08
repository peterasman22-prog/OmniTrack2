import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createDeviceTwinSchema, updateDeviceTwinSchema } from '../utils/validation';
import prisma from '../services/database';
import { logger } from '../utils/logger';

export class DeviceTwinController {
  // GET /api/device-twins
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, venueId, vendor } = req.query;
      const where: any = {};
      if (tenantId) where.tenantId = tenantId as string;
      if (venueId) where.venueId = venueId as string;
      if (vendor) where.vendor = vendor as string;

      const twins = await prisma.deviceTwin.findMany({
        where,
        include: { asset: { select: { id: true, name: true, type: true, status: true } } },
        orderBy: { lastSeen: 'desc' },
      });

      res.json(twins);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/device-twins/:id
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const twin = await prisma.deviceTwin.findUnique({
        where: { id: req.params.id },
        include: { asset: true },
      });

      if (!twin) {
        throw new AppError('Device twin not found', 404);
      }

      res.json(twin);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/device-twins
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = createDeviceTwinSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      // Check if device twin already exists
      const existing = await prisma.deviceTwin.findUnique({ where: { deviceId: value.deviceId } });
      if (existing) {
        throw new AppError('Device twin already exists for this device', 409);
      }

      const twin = await prisma.deviceTwin.create({ data: value });
      logger.info('Device twin created', { deviceId: twin.deviceId });
      res.status(201).json(twin);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/device-twins/:id
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = updateDeviceTwinSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const existing = await prisma.deviceTwin.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Device twin not found', 404);
      }

      const twin = await prisma.deviceTwin.update({
        where: { id: req.params.id },
        data: value,
      });

      logger.info('Device twin updated', { deviceId: twin.deviceId });
      res.json(twin);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/device-twins/:id
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.deviceTwin.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Device twin not found', 404);
      }

      await prisma.deviceTwin.delete({ where: { id: req.params.id } });
      logger.info('Device twin deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/device-twins/by-device/:deviceId
  async getByDeviceId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const twin = await prisma.deviceTwin.findUnique({
        where: { deviceId: req.params.deviceId },
        include: { asset: true },
      });

      if (!twin) {
        throw new AppError('Device twin not found', 404);
      }

      res.json(twin);
    } catch (error) {
      next(error);
    }
  }
}

export const deviceTwinController = new DeviceTwinController();
