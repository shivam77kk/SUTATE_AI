import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { changeFirstPassword, forgotPassword, resetPassword } from '../controllers/passwordController.js';
const router = express.Router();
router.post('/change-first', authenticate, changeFirstPassword);
router.post('/forgot', forgotPassword);
router.post('/reset/:token', resetPassword);
export default router;
