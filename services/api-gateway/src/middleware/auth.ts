import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  tenantId?: string;
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // MVP: auth can be disabled for development
  if (!config.auth.enabled) {
    req.tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    req.userId = 'dev-user';
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;

  if (apiKey) {
    // TODO: validate API key against database
    req.tenantId = 'default-tenant';
    req.userId = 'api-user';
    return next();
  }

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: validate JWT token
    req.tenantId = 'default-tenant';
    req.userId = 'jwt-user';
    return next();
  }

  logger.warn('Unauthorized request', { path: req.path, ip: req.ip });
  res.status(401).json({ error: 'Unauthorized', message: 'Valid authentication required' });
};
