import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createVenueSchema, updateVenueSchema, createZoneSchema } from '../utils/validation';
import prisma from '../services/database';
import { logger } from '../utils/logger';

export class VenueController {
  // GET /api/venues
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const venues = await prisma.venue.findMany({
        include: {
          floors: {
            include: {
              zones: true,
            },
            orderBy: { level: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json(venues);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/venues/:id
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: req.params.id },
        include: {
          floors: {
            include: { zones: true },
            orderBy: { level: 'asc' },
          },
        },
      });

      if (!venue) {
        throw new AppError('Venue not found', 404);
      }

      res.json(venue);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/venues
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = createVenueSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const { floors, ...venueData } = value;

      const venue = await prisma.venue.create({
        data: {
          ...venueData,
          floors: {
            create: floors || [],
          },
        },
        include: {
          floors: { include: { zones: true } },
        },
      });

      logger.info('Venue created', { venueId: venue.id, name: venue.name });
      res.status(201).json(venue);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/venues/:id
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = updateVenueSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const existing = await prisma.venue.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Venue not found', 404);
      }

      const venue = await prisma.venue.update({
        where: { id: req.params.id },
        data: value,
        include: { floors: { include: { zones: true } } },
      });

      logger.info('Venue updated', { venueId: venue.id });
      res.json(venue);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/venues/:id
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.venue.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        throw new AppError('Venue not found', 404);
      }

      await prisma.venue.delete({ where: { id: req.params.id } });
      logger.info('Venue deleted', { venueId: req.params.id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/venues/:venueId/floors
  async getFloors(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const floors = await prisma.floor.findMany({
        where: { venueId: req.params.venueId },
        include: { zones: true },
        orderBy: { level: 'asc' },
      });

      res.json(floors);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/venues/:venueId/zones
  async getZones(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { floorId } = req.query;
      const where: any = {};

      // Get all floors for this venue first
      const floors = await prisma.floor.findMany({
        where: { venueId: req.params.venueId },
        select: { id: true },
      });
      const floorIds = floors.map((f) => f.id);

      where.floorId = { in: floorIds };
      if (floorId) {
        where.floorId = floorId as string;
      }

      const zones = await prisma.zone.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      res.json(zones);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/venues/:venueId/zones
  async createZone(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = createZoneSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const zone = await prisma.zone.create({ data: value });
      logger.info('Zone created', { zoneId: zone.id, name: zone.name });
      res.status(201).json(zone);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/venues/:venueId/positions
  async getLivePositions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const assets = await prisma.asset.findMany({
        where: { venueId: req.params.venueId, status: 'active' },
        include: { deviceTwin: true },
      });

      const positions = assets
        .filter((a) => a.deviceTwin && a.deviceTwin.x !== null)
        .map((a) => ({
          assetId: a.id,
          deviceId: a.deviceTwin!.deviceId,
          position: {
            x: a.deviceTwin!.x || 0,
            y: a.deviceTwin!.y || 0,
            z: a.deviceTwin!.z,
            lat: a.deviceTwin!.lat,
            lon: a.deviceTwin!.lon,
          },
          floor: a.deviceTwin!.floorId || '',
          accuracy: a.deviceTwin!.accuracy,
          timestamp: a.deviceTwin!.lastSeen?.toISOString() || '',
        }));

      res.json(positions);
    } catch (error) {
      next(error);
    }
  }
}

export const venueController = new VenueController();
