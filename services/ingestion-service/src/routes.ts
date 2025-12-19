import { Router } from 'express';
import { telemetryController } from './controllers/telemetryController';
import { authMiddleware } from './middleware/auth';

export const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ingestion-service' });
});

// Telemetry ingestion endpoints
router.post('/v1/telemetry', authMiddleware, (req, res) => telemetryController.ingestSingle(req, res));
router.post('/v1/telemetry/batch', authMiddleware, (req, res) => telemetryController.ingestBatch(req, res));
