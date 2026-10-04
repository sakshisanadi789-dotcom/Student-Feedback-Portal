import { FormQuestionRepository } from '../repositories/formQuestionRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

const repository = new FormQuestionRepository();

export const list = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Form questions retrieved successfully', data: await repository.list(req.params.id) });
});

export const replace = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.question_ids)) throw new AppError('question_ids must be an array', 422, 'VALIDATION_ERROR');
  res.json({ success: true, message: 'Form questions updated successfully', data: await repository.replace(req.params.id, req.body.question_ids) });
});