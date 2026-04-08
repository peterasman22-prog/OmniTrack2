import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  serviceName: process.env.SERVICE_NAME || 'api-gateway',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://omnitrack:omnitrack@localhost:5432/omnitrack?schema=public',
  },

  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222',
    topicRaw: process.env.NATS_TOPIC_RAW || 'telemetry.raw',
    topicNormalized: process.env.NATS_TOPIC_NORMALIZED || 'telemetry.normalized',
  },

  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
