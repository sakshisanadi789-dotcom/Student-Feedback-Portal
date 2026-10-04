import { FeedbackRepository } from '../repositories/feedbackRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

const repository = new FeedbackRepository();

export const myResponseStatus = asyncHandler(async (req, res) => {
  const submitted = await repository.hasSubmitted(req.user.id, req.params.id);
  res.json({ success: true, message: 'Submission status retrieved successfully', data: { submitted } });
});

export const submit = asyncHandler(async (req, res) => {
  const { form_id, answers } = req.body;
  if (!Number.isInteger(Number(form_id)) || !Array.isArray(answers)) throw new AppError('form_id and an answers array are required', 422, 'VALIDATION_ERROR');
  const data = await repository.submit({ userId: req.user.id, formId: Number(form_id), answers });
  res.status(201).json({ success: true, message: 'Feedback submitted successfully', data });
});

export const replaceAnswers = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.answers)) throw new AppError('An answers array is required', 422, 'VALIDATION_ERROR');
  const data = await repository.replaceAnswers(req.params.id, req.body.answers);
  res.json({ success: true, message: 'Feedback response updated successfully', data });
});

export const removeResponse = asyncHandler(async (req, res) => {
  if (!(await repository.deleteResponse(req.params.id))) throw new AppError('Feedback response not found', 404, 'NOT_FOUND');
  res.json({ success: true, message: 'Feedback response deleted successfully', data: { id: Number(req.params.id), deleted: true } });
});