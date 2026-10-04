import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AuthRepository } from '../repositories/authRepository.js';
import { AppError } from '../utils/appError.js';

export class AuthService {
  constructor(repository = new AuthRepository()) {
    this.repository = repository;
  }

  async login({ email, password }) {
    const user = await this.repository.findByEmail(email.toLowerCase());
    if (!user || user.status !== 'active' || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS');
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    return { token, user: User.toPublic(user) };
  }

  async register({ full_name, email, password }) {
    if (password.length < 8) throw new AppError('Password must contain at least 8 characters', 422, 'VALIDATION_ERROR');
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      return User.toPublic(await this.repository.createStudent({ fullName: full_name.trim(), email: email.toLowerCase(), passwordHash }));
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL');
      throw error;
    }
  }
}