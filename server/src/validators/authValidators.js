import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(1).max(72),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(1).max(140),
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(72),
});