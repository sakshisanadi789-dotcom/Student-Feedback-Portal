import { Router } from 'express';
import { dashboard, summary } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/dashboard', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), dashboard);
router.get('/reports/feedback', authenticateToken, authorizeRoles('admin', 'manager', 'teacher'), summary);
export default router;