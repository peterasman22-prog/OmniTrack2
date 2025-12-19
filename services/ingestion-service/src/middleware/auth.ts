import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  tenantId?: string;
  vendorId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Skip auth if disabled (for MVP)
  if (!config.auth.enabled) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers['authorization'] as string;

  // Simple API key validation (replace with proper auth in production)
  if (apiKey) {
    // TODO: Validate API key against database
    req.tenantId = 'tenant-from-api-key';
    req.vendorId = 'vendor-from-api-key';
    return next();
  }

  // Bearer token validation
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Validate JWT token
    req.tenantId = 'tenant-from-jwt';
    req.vendorId = 'vendor-from-jwt';
    return next();
  }

  logger.warn('Unauthorized request', { path: req.path, ip: req.ip });
  return res.status(401).json({ error: 'Unauthorized' });
};
