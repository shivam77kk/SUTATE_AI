import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getCurriculum,
  analyseCurriculum,
  getCurriculumFlags,
  runCurriculumAnalysis,
} from '../controllers/curriculumController.js';

const router = express.Router();
router.get('/', authenticate, requireRole('admin'), getCurriculum);
router.post('/analyse', authenticate, requireRole('admin'), analyseCurriculum);
router.get('/flags', authenticate, requireRole('admin'), getCurriculumFlags);
router.post('/generate-flags', authenticate, requireRole('admin'), runCurriculumAnalysis);

export default router;
