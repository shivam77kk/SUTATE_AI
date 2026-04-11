import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { saveSheetConfig, getSheetConfig,
         removeSheetConfig, manualSync } from '../controllers/sheetsController.js';
const router = express.Router();
router.post('/',         authenticate, requireRole('faculty', 'admin'), saveSheetConfig);
router.get('/',          authenticate, requireRole('faculty', 'admin'), getSheetConfig);
router.delete('/',       authenticate, requireRole('faculty', 'admin'), removeSheetConfig);
router.post('/sync-now', authenticate, requireRole('faculty', 'admin'), manualSync);
export default router;
