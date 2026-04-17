import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { geminiLimiter } from '../middleware/rateLimiter.js';
import * as ac from '../controllers/adminController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate, requireRole('admin'));
router.post('/transcribe', upload.single('audio'), ac.transcribeAudio);

router.get('/overview', ac.getOverview);
router.get('/naac-export', ac.exportNaac);
router.get('/top-atrisk', ac.getTopAtRisk);
router.get('/trends', ac.getTrends);
router.get('/report', ac.getAdminReportData);
router.get('/report/executive', ac.downloadExecutiveReport);
router.get('/report/naac', ac.exportNaac);
router.post('/ask', geminiLimiter, ac.naturalLanguageQuery);
router.post('/nl-query', geminiLimiter, ac.naturalLanguageQuery);
router.get('/ask/history', ac.getQueryHistory);
router.get('/users', ac.getUsers);
router.post('/users', ac.createUser);
router.get('/users/export', ac.exportUsers);
router.get('/check-studentid', ac.checkStudentId);
router.get('/registration-health', ac.getRegistrationHealth);
router.patch('/users/:id', ac.editUser);
router.delete('/users/:id', ac.deleteUser);
router.post('/users/:id/reset-password', ac.adminResetPassword);
router.post('/users/bulk-deactivate', ac.bulkDeactivateUsers);
router.get('/system', ac.getSystemHealth);
router.get('/logs', ac.getAdminLogs);
router.get('/voice-status', ac.getVoiceStatus);
router.get('/dept/:dept', ac.getDeptDrilldown);
router.get('/intervention-scores', ac.getInterventionScores);
router.get('/faculty-effectiveness', ac.getFacultyEffectivenessLeaderboard);
export default router;

