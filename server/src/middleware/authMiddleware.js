import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required', error: 'UNAUTHENTICATED' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session is invalid or expired', error: 'INVALID_TOKEN' });
  }
}