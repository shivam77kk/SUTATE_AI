import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getMyInterventions, getInterventionStats } from '../controllers/interventionController.js';
const router = express.Router();
router.get('/my', authenticate, requireRole('faculty'), getMyInterventions);
router.get('/stats', authenticate, getInterventionStats);
export default router;
