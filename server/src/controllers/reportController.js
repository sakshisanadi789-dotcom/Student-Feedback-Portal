import { ReportService } from '../services/reportService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const service = new ReportService();

export const dashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Dashboard retrieved successfully', data: await service.dashboard() });
});

export const summary = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Feedback report retrieved successfully', data: await service.summary(req.query, req.user) });
});