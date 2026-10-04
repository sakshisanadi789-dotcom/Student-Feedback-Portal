import { pool } from '../config/database.js';
import { AppError } from '../utils/appError.js';

export class FormQuestionRepository {
  async list(formId) {
    const [forms] = await pool.execute('SELECT id FROM feedback_forms WHERE id = ?', [formId]);
    if (!forms[0]) throw new AppError('Feedback form not found', 404, 'NOT_FOUND');
    const [rows] = await pool.execute(
      `SELECT q.id, q.prompt, q.question_type, q.options, q.is_required, fq.position
       FROM feedback_form_questions fq JOIN feedback_questions q ON q.id = fq.question_id
       WHERE fq.form_id = ? ORDER BY fq.position, q.id`, [formId]);
    return rows;
  }

  async replace(formId, questionIds) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [forms] = await connection.execute('SELECT id FROM feedback_forms WHERE id = ? FOR UPDATE', [formId]);
      if (!forms[0]) throw new AppError('Feedback form not found', 404, 'NOT_FOUND');
      const ids = [...new Set(questionIds.map(Number))];
      if (ids.some((id) => !Number.isInteger(id) || id < 1)) throw new AppError('Question IDs must be positive integers', 422, 'VALIDATION_ERROR');
      if (ids.length) {
        const [questions] = await connection.query("SELECT id FROM feedback_questions WHERE id IN (?) AND status = 'active'", [ids]);
        if (questions.length !== ids.length) throw new AppError('One or more selected questions are unavailable', 422, 'INVALID_QUESTION');
      }
      await connection.execute('DELETE FROM feedback_form_questions WHERE form_id = ?', [formId]);
      for (const [index, questionId] of ids.entries()) {
        await connection.execute('INSERT INTO feedback_form_questions (form_id, question_id, position) VALUES (?, ?, ?)', [formId, questionId, index + 1]);
      }
      await connection.commit();
      return this.list(formId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}