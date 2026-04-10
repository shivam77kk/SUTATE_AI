import express from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import { geminiLimiter } from '../middleware/rateLimiter.js';
import { 
  uploadCSV, 
  validateCSV, 
  getMismatchReport, 
  getTemplateCSV, 
  getUploadLogs, 
  getDataCompleteness,
  setAutoRerun, 
  getAutoRerunStatus 
} from '../controllers/uploadController.js';
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();
router.post('/validate', authenticate, requireRole('faculty'), upload.single('file'), validateCSV);
router.post('/', authenticate, requireRole('faculty'), uploadCSV);
router.get('/mismatch-report/:id', authenticate, getMismatchReport);
router.get('/template-csv', authenticate, getTemplateCSV);
router.get('/logs', authenticate, getUploadLogs);
router.get('/data-completeness', authenticate, requireRole('faculty'), getDataCompleteness);
router.patch('/auto-rerun/:classId', authenticate, requireRole('faculty'), setAutoRerun);
router.get('/auto-rerun-status', authenticate, requireRole('faculty'), getAutoRerunStatus);
export default router;
