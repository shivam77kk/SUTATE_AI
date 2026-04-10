import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { addParentContact, removeParentContact, getParentContact } from '../controllers/parentController.js';

const router = express.Router();
router.get('/', authenticate, requireRole('student'), getParentContact);
router.post('/', authenticate, requireRole('student'), addParentContact);
router.delete('/', authenticate, requireRole('student'), removeParentContact);

export default router;
