import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

const service = new AuthService();

export const login = asyncHandler(async (req, res) => {
  if (!req.body.email || !req.body.password) throw new AppError('Email and password are required', 422, 'VALIDATION_ERROR');
  res.json({ success: true, message: 'Signed in successfully', data: await service.login(req.body) });
});

export const register = asyncHandler(async (req, res) => {
  if (!req.body.full_name || !req.body.email || !req.body.password) throw new AppError('Name, email and password are required', 422, 'VALIDATION_ERROR');
  res.status(201).json({ success: true, message: 'Student account created', data: await service.register(req.body) });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Signed out successfully', data: {} });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Current user retrieved', data: req.user });
});