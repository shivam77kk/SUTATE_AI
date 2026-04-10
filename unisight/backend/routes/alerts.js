import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendAlert } from '../controllers/alertController.js';
const router = express.Router();
router.post('/:studentId', authenticate, requireRole('faculty', 'admin'), sendAlert);
export default router;
