import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  submitRequest,
  getMyRequests,
  getFacultyQueue,
  respondToRequest,
} from '../controllers/helpController.js';

const router = express.Router();

router.post('/', authenticate, requireRole('student'), submitRequest);
router.post('/request', authenticate, requireRole('student'), submitRequest);
router.get('/my', authenticate, requireRole('student'), getMyRequests);
router.get('/my-requests', authenticate, requireRole('student'), getMyRequests);
router.get('/faculty-queue', authenticate, requireRole('faculty', 'admin'), getFacultyQueue);
router.patch('/:id/respond', authenticate, requireRole('faculty', 'admin'), respondToRequest);

export default router;
