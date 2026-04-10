import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getGoal, setGoal } from '../controllers/goalController.js';
const router = express.Router();
router.get('/', authenticate, requireRole('student'), getGoal);
router.post('/', authenticate, requireRole('student'), setGoal);
export default router;
