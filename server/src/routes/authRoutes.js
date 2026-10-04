import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';

const router = Router();
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
export default router;