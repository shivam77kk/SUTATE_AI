import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { saveSheetConfig, getSheetConfig,
         removeSheetConfig, manualSync } from '../controllers/sheetsController.js';
const router = express.Router();
router.post('/',         authenticate, requireRole('faculty'), saveSheetConfig);
router.get('/',          authenticate, requireRole('faculty'), getSheetConfig);
router.delete('/',       authenticate, requireRole('faculty'), removeSheetConfig);
router.post('/sync-now', authenticate, requireRole('faculty'), manualSync);
export default router;
