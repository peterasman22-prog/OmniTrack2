import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initWebSocket } from './services/websocket';
import { startNatsConsumer, stopNatsConsumer } from './services/natsConsumer';
import prisma from './services/database';

const app = express();
const httpServer = createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Fallback health check at root
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: config.serviceName });
});

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── WebSocket ───────────────────────────────────────────────────────────────
initWebSocket(httpServer);

// ─── Start Server ────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Start NATS consumer
    startNatsConsumer().catch((err) => {
      logger.warn('NATS consumer failed to start (will retry)', { error: err.message });
    });

    httpServer.listen(config.port, () => {
      logger.info(`API Gateway running on port ${config.port}`, {
        env: config.env,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start API Gateway', { error: (error as Error).message });
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await stopNatsConsumer();
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await stopNatsConsumer();
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

start();

export default app;
