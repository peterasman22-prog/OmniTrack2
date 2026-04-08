import { Router } from 'express';
import { assetController } from '../controllers/assetController';
import { venueController } from '../controllers/venueController';
import { deviceTwinController } from '../controllers/deviceTwinController';
import { alertController } from '../controllers/alertController';
import { telemetryController } from '../controllers/telemetryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ─── Health Check ────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ─── Auth (stub for MVP) ─────────────────────────────────────────────────────
router.post('/auth/login', (_req, res) => {
  // MVP stub - returns a fake token
  res.json({
    token: 'dev-token-omnitrack',
    user: { id: 'dev-user', email: 'dev@omnitrack.io', name: 'Dev User', role: 'admin', tenantId: 'default-tenant' },
  });
});

router.post('/auth/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/auth/validate', authMiddleware, (req: any, res) => {
  res.json({ valid: true, tenantId: req.tenantId });
});

router.get('/auth/me', authMiddleware, (req: any, res) => {
  res.json({ id: req.userId, email: 'dev@omnitrack.io', name: 'Dev User', role: 'admin', tenantId: req.tenantId });
});

// ─── Assets ──────────────────────────────────────────────────────────────────
router.get('/assets', authMiddleware, (req, res, next) => assetController.getAll(req as any, res, next));
router.get('/assets/:id', authMiddleware, (req, res, next) => assetController.getById(req as any, res, next));
router.post('/assets', authMiddleware, (req, res, next) => assetController.create(req as any, res, next));
router.put('/assets/:id', authMiddleware, (req, res, next) => assetController.update(req as any, res, next));
router.delete('/assets/:id', authMiddleware, (req, res, next) => assetController.delete(req as any, res, next));
router.get('/assets/:id/position', authMiddleware, (req, res, next) => assetController.getPosition(req as any, res, next));

// ─── Venues ──────────────────────────────────────────────────────────────────
router.get('/venues', authMiddleware, (req, res, next) => venueController.getAll(req as any, res, next));
router.get('/venues/:id', authMiddleware, (req, res, next) => venueController.getById(req as any, res, next));
router.post('/venues', authMiddleware, (req, res, next) => venueController.create(req as any, res, next));
router.put('/venues/:id', authMiddleware, (req, res, next) => venueController.update(req as any, res, next));
router.delete('/venues/:id', authMiddleware, (req, res, next) => venueController.delete(req as any, res, next));
router.get('/venues/:venueId/floors', authMiddleware, (req, res, next) => venueController.getFloors(req as any, res, next));
router.get('/venues/:venueId/zones', authMiddleware, (req, res, next) => venueController.getZones(req as any, res, next));
router.post('/venues/:venueId/zones', authMiddleware, (req, res, next) => venueController.createZone(req as any, res, next));
router.get('/venues/:venueId/positions', authMiddleware, (req, res, next) => venueController.getLivePositions(req as any, res, next));

// ─── Device Twins ────────────────────────────────────────────────────────────
router.get('/device-twins', authMiddleware, (req, res, next) => deviceTwinController.getAll(req as any, res, next));
router.get('/device-twins/:id', authMiddleware, (req, res, next) => deviceTwinController.getById(req as any, res, next));
router.post('/device-twins', authMiddleware, (req, res, next) => deviceTwinController.create(req as any, res, next));
router.put('/device-twins/:id', authMiddleware, (req, res, next) => deviceTwinController.update(req as any, res, next));
router.delete('/device-twins/:id', authMiddleware, (req, res, next) => deviceTwinController.delete(req as any, res, next));
router.get('/device-twins/by-device/:deviceId', authMiddleware, (req, res, next) => deviceTwinController.getByDeviceId(req as any, res, next));

// ─── Alerts ──────────────────────────────────────────────────────────────────
router.get('/alerts', authMiddleware, (req, res, next) => alertController.getAll(req as any, res, next));
router.get('/alerts/:id', authMiddleware, (req, res, next) => alertController.getById(req as any, res, next));
router.post('/alerts', authMiddleware, (req, res, next) => alertController.create(req as any, res, next));
router.post('/alerts/:id/acknowledge', authMiddleware, (req, res, next) => alertController.acknowledge(req as any, res, next));
router.post('/alerts/:id/resolve', authMiddleware, (req, res, next) => alertController.resolve(req as any, res, next));

// ─── Telemetry ───────────────────────────────────────────────────────────────
router.get('/telemetry', authMiddleware, (req, res, next) => telemetryController.query(req as any, res, next));
router.get('/telemetry/latest', authMiddleware, (req, res, next) => telemetryController.getLatest(req as any, res, next));
router.get('/telemetry/stats', authMiddleware, (req, res, next) => telemetryController.getStats(req as any, res, next));

export default router;
