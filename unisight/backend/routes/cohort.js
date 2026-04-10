import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getCohorts,
  getCohortById,
  updateDropoutCount,
  getCohortDetail,
  updateCohort,
} from '../controllers/cohortController.js';

const router = express.Router();
router.get('/', authenticate, requireRole('admin'), getCohorts);
router.get('/:cohortId', authenticate, requireRole('admin'), getCohortById);
router.patch('/:cohortId/dropout-count', authenticate, requireRole('admin'), updateDropoutCount);
router.get('/legacy/:cohortId', authenticate, requireRole('admin'), getCohortDetail);
router.patch('/legacy/:cohortId/dropout-count', authenticate, requireRole('admin'), updateCohort);

export default router;
