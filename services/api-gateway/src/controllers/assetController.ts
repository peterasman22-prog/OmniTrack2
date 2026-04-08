import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createAssetSchema, updateAssetSchema } from '../utils/validation';
import prisma from '../services/database';
import { logger } from '../utils/logger';

export class AssetController {
  // GET /api/assets
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { venueId, status, type } = req.query;

      const where: any = {};
      if (venueId) where.venueId = venueId as string;
      if (status) where.status = status as string;
      if (type) where.type = type as string;

      const assets = await prisma.asset.findMany({
        where,
        include: {
          deviceTwin: {
            select: {
              deviceId: true,
              x: true,
              y: true,
              z: true,
              lat: true,
              lon: true,
              floorId: true,
              accuracy: true,
              battery: true,
              lastSeen: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Map to frontend expected format with position
      const result = assets.map((asset) => {
        const { deviceTwin, ...rest } = asset;
        return {
          ...rest,
          position: deviceTwin ? {
            assetId: asset.id,
            deviceId: deviceTwin.deviceId,
            position: { x: deviceTwin.x || 0, y: deviceTwin.y || 0, z: deviceTwin.z },
            floor: deviceTwin.floorId || '',
            accuracy: deviceTwin.accuracy,
            timestamp: deviceTwin.lastSeen?.toISOString() || '',
          } : undefined,
          battery: deviceTwin?.battery,
          lastSeen: deviceTwin?.lastSeen?.toISOString(),
        };
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/assets/:id
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: req.params.id },
        include: { deviceTwin: true },
      });

      if (!asset) {
        throw new AppError('Asset not found', 404);
      }

      res.json(asset);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/assets
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = createAssetSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const asset = await prisma.asset.create({
        data: value,
      });

      logger.info('Asset created', { assetId: asset.id, name: asset.name });
      res.status(201).json(asset);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/assets/:id
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = updateAssetSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Asset not found', 404);
      }

      const asset = await prisma.asset.update({
        where: { id: req.params.id },
        data: value,
      });

      logger.info('Asset updated', { assetId: asset.id });
      res.json(asset);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/assets/:id
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Asset not found', 404);
      }

      await prisma.asset.delete({ where: { id: req.params.id } });
      logger.info('Asset deleted', { assetId: req.params.id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/assets/:id/position
  async getPosition(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: req.params.id },
        include: { deviceTwin: true },
      });

      if (!asset) {
        throw new AppError('Asset not found', 404);
      }

      if (!asset.deviceTwin) {
        throw new AppError('No position data available for this asset', 404);
      }

      const position = {
        assetId: asset.id,
        deviceId: asset.deviceTwin.deviceId,
        position: {
          x: asset.deviceTwin.x || 0,
          y: asset.deviceTwin.y || 0,
          z: asset.deviceTwin.z,
          lat: asset.deviceTwin.lat,
          lon: asset.deviceTwin.lon,
        },
        floor: asset.deviceTwin.floorId || '',
        accuracy: asset.deviceTwin.accuracy,
        timestamp: asset.deviceTwin.lastSeen?.toISOString() || '',
      };

      res.json(position);
    } catch (error) {
      next(error);
    }
  }
}

export const assetController = new AssetController();
