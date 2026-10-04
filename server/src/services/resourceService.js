import bcrypt from 'bcryptjs';
import { resources } from '../models/resourceDefinitions.js';
import { ResourceRepository } from '../repositories/resourceRepository.js';
import { AppError } from '../utils/appError.js';

export class ResourceService {
  constructor(repository = new ResourceRepository()) {
    this.repository = repository;
  }

  getSpec(name) {
    const spec = resources[name];
    if (!spec) throw new AppError('Resource not found', 404, 'NOT_FOUND');
    return spec;
  }

  async list(name, query) {
    const spec = this.getSpec(name);
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
    const filters = {};
    for (const filter of spec.filters) if (query[filter] !== undefined && query[filter] !== '') filters[filter] = query[filter];
    const sortBy = spec.sort.includes(query.sortBy) ? query.sortBy : 'id';
    const sortOrder = String(query.sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const result = await this.repository.list(spec, { page, limit, search: String(query.search || '').slice(0, 100), filters, sortBy, sortOrder });
    return { data: result.rows, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } };
  }

  async get(name, id) {
    const row = await this.repository.findById(this.getSpec(name), id);
    if (!row) throw new AppError('Record not found', 404, 'NOT_FOUND');
    return row;
  }

  async create(name, input) {
    const spec = this.getSpec(name);
    if (name === 'feedback-forms' && input.question_ids !== undefined && !Array.isArray(input.question_ids)) {
      throw new AppError('question_ids must be an array', 422, 'VALIDATION_ERROR');
    }
    const data = this.cleanInput(spec, input, true);
    const questionIds = Array.isArray(input.question_ids) ? input.question_ids : [];
    if (name === 'users') {
      if (!input.password || String(input.password).length < 8) throw new AppError('Password must contain at least 8 characters', 422, 'VALIDATION_ERROR');
      data.password_hash = await bcrypt.hash(String(input.password), 12);
    }
    this.assertRequired(spec, data);
    this.validateQuestion(name, data);
    try {
      return name === 'feedback-forms'
        ? await this.repository.createForm(spec, data, questionIds)
        : await this.repository.create(spec, data);
    } catch (error) {
      this.translateDatabaseError(error);
    }
  }

  async update(name, id, input) {
    const spec = this.getSpec(name);
    if (name === 'feedback-forms' && input.question_ids !== undefined && !Array.isArray(input.question_ids)) {
      throw new AppError('question_ids must be an array', 422, 'VALIDATION_ERROR');
    }
    const data = this.cleanInput(spec, input, false);
    const questionIds = Array.isArray(input.question_ids) ? input.question_ids : undefined;
    if (name === 'users' && input.password) {
      if (String(input.password).length < 8) throw new AppError('Password must contain at least 8 characters', 422, 'VALIDATION_ERROR');
      data.password_hash = await bcrypt.hash(String(input.password), 12);
    }
    if (!Object.keys(data).length && questionIds === undefined) throw new AppError('Provide at least one valid field to update', 422, 'VALIDATION_ERROR');
    this.validateQuestion(name, data);
    try {
      const result = name === 'feedback-forms'
        ? await this.repository.updateForm(spec, id, data, questionIds)
        : await this.repository.update(spec, id, data);
      if (!result) throw new AppError('Record not found', 404, 'NOT_FOUND');
      return result;
    } catch (error) {
      this.translateDatabaseError(error);
    }
  }

  async remove(name, id) {
    if (!(await this.repository.remove(this.getSpec(name), id))) throw new AppError('Record not found', 404, 'NOT_FOUND');
    return { id: Number(id), deleted: true };
  }

  cleanInput(spec, input, creating) {
    const data = {};
    for (const [key, value] of Object.entries(input || {})) {
      if (!spec.writable.includes(key) || (key === 'password_hash')) continue;
      if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new AppError('Enter a valid email address', 422, 'VALIDATION_ERROR');
      if (['course_id', 'subject_id', 'teacher_id', 'role_id', 'enrollment_year'].includes(key) && value !== '' && value !== null && !Number.isInteger(Number(value))) {
        throw new AppError(`${key} must be a whole number`, 422, 'VALIDATION_ERROR');
      }
      if (key === 'options' && (value === null || value === '')) {
        data[key] = null;
      } else if (key === 'options') {
        try { data[key] = JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value); } catch { throw new AppError('Options must be valid JSON', 422, 'VALIDATION_ERROR'); }
      } else if (['course_id', 'subject_id', 'teacher_id', 'role_id', 'enrollment_year'].includes(key) && (value === '' || value === null)) {
        data[key] = null;
      } else {
        data[key] = value;
      }
    }
    if (creating && !Object.keys(data).length && spec.table !== 'users') throw new AppError('Request body has no supported fields', 422, 'VALIDATION_ERROR');
    return data;
  }

  assertRequired(spec, data) {
    const missing = spec.required.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
    if (missing.length) throw new AppError(`Required fields: ${missing.join(', ')}`, 422, 'VALIDATION_ERROR');
  }

  validateQuestion(name, data) {
    if (name !== 'feedback-questions' || data.question_type !== 'multiple_choice') return;
    let options = data.options;
    try { if (typeof options === 'string') options = JSON.parse(options); } catch { throw new AppError('Options must be valid JSON', 422, 'VALIDATION_ERROR'); }
    if (!Array.isArray(options) || options.length < 2 || options.some((option) => typeof option !== 'string' || !option.trim())) {
      throw new AppError('Multiple-choice questions require at least two text options', 422, 'VALIDATION_ERROR');
    }
  }

  translateDatabaseError(error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError('A record with this unique value already exists', 409, 'DUPLICATE_RECORD');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') throw new AppError('A referenced record does not exist', 422, 'INVALID_REFERENCE');
    if (error.code === 'ER_ROW_IS_REFERENCED_2') throw new AppError('This record is in use and cannot be deleted', 409, 'RECORD_IN_USE');
    throw error;
  }
}