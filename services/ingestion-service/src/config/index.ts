import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  serviceName: process.env.SERVICE_NAME || 'ingestion-service',
  
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222',
    topicRaw: process.env.NATS_TOPIC_RAW || 'telemetry.raw',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
  
  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  },
};
