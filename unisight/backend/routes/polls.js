import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createPoll, closePoll, getMyActivePolls,
  submitPollResponse, getPollResults, getMyPolls
} from '../controllers/pollController.js';
const router = express.Router();
router.post('/',                   authenticate, requireRole('faculty'),          createPoll);
router.get('/my',                  authenticate, requireRole('faculty','admin'),   getMyPolls);
router.patch('/:pollId/close',     authenticate, requireRole('faculty'),          closePoll);
router.get('/active',              authenticate, requireRole('student'),           getMyActivePolls);
router.post('/:pollId/respond',    authenticate, requireRole('student'),           submitPollResponse);
router.get('/:pollId/results',     authenticate, requireRole('faculty','admin'),   getPollResults);
export default router;
