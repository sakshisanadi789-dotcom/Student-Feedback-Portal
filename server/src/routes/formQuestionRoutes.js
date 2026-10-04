import { Router } from 'express';
import { list, replace } from '../controllers/formQuestionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/feedback-forms/:id/questions', authenticateToken, authorizeRoles('admin', 'manager', 'staff', 'teacher', 'student'), list);
router.put('/feedback-forms/:id/questions', authenticateToken, authorizeRoles('admin', 'manager'), replace);
export default router;