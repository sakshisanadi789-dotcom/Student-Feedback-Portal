import { Router } from 'express';
import { myResponseStatus, removeResponse, replaceAnswers, submit } from '../controllers/feedbackController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/feedback-forms/:id/my-response', authenticateToken, authorizeRoles('student'), myResponseStatus);
router.post('/feedback-responses', authenticateToken, authorizeRoles('student'), submit);
router.put('/feedback-responses/:id', authenticateToken, authorizeRoles('admin', 'manager'), replaceAnswers);
router.patch('/feedback-responses/:id', authenticateToken, authorizeRoles('admin', 'manager'), replaceAnswers);
router.delete('/feedback-responses/:id', authenticateToken, authorizeRoles('admin'), removeResponse);
export default router;