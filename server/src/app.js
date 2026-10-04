import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import formQuestionRoutes from './routes/formQuestionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Student Feedback Portal API is running', data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api', reportRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', formQuestionRoutes);
app.use('/api', resourceRoutes);
app.use(notFoundHandler);
app.use(errorHandler);