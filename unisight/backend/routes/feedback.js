import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { submitFeedback, getFeedbackStatus,
         getClassFeedbackSummary, getAdminFeedbackOverview } from '../controllers/feedbackController.js';

const router = express.Router();
router.post('/', authenticate, requireRole('student'), submitFeedback);
router.get('/status/:uploadId', authenticate, requireRole('student'), getFeedbackStatus);
router.get('/class/:classId', authenticate, requireRole('faculty', 'admin'), getClassFeedbackSummary);
router.get('/overview', authenticate, requireRole('admin'), getAdminFeedbackOverview);
export default router;
