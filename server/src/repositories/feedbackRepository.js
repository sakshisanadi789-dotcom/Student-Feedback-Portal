import { pool } from '../config/database.js';

function validateAnswers(questions, answers) {
  const questionMap = new Map(questions.map((question) => [Number(question.id), question]));
  const answerMap = new Map(answers.map((answer) => [Number(answer.question_id), answer]));
  for (const question of questions) {
    const answer = answerMap.get(Number(question.id));
    const value = answer?.[question.question_type === 'rating' ? 'rating_value' : question.question_type === 'multiple_choice' ? 'choice_value' : 'text_value'];
    const hasValue = value !== undefined && value !== null && value !== '';
    if (question.is_required && !hasValue) throw Object.assign(new Error(`Answer required for question ${question.id}`), { statusCode: 422, code: 'ANSWER_REQUIRED' });
  }
  if (answerMap.size !== answers.length) throw Object.assign(new Error('Each question can only be answered once'), { statusCode: 422, code: 'DUPLICATE_ANSWER' });
  for (const answer of answers) {
    const question = questionMap.get(Number(answer.question_id));
    if (!question) throw Object.assign(new Error('Question does not belong to this feedback form'), { statusCode: 422, code: 'INVALID_QUESTION' });
    if (question.question_type === 'rating' && (!Number.isInteger(Number(answer.rating_value)) || Number(answer.rating_value) < 1 || Number(answer.rating_value) > 5)) {
      throw Object.assign(new Error('Rating answers must be whole numbers from 1 to 5'), { statusCode: 422, code: 'INVALID_RATING' });
    }
    if (question.question_type === 'multiple_choice') {
      const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
      if (!Array.isArray(options) || !options.includes(answer.choice_value)) throw Object.assign(new Error('Choose one of the available options'), { statusCode: 422, code: 'INVALID_CHOICE' });
    }
    if (question.question_type === 'text' && answer.text_value !== undefined && typeof answer.text_value !== 'string') {
      throw Object.assign(new Error('Written feedback must be text'), { statusCode: 422, code: 'INVALID_TEXT' });
    }
  }
}

export class FeedbackRepository {
  async hasSubmitted(userId, formId) {
    const [rows] = await pool.execute(
      `SELECT EXISTS(
         SELECT 1 FROM feedback_responses fr
         JOIN students s ON s.id = fr.student_id
         WHERE s.user_id = ? AND fr.form_id = ?
       ) AS submitted`, [userId, formId]);
    return Boolean(rows[0].submitted);
  }

  async submit({ userId, formId, answers }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [students] = await connection.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
      if (!students[0]) throw Object.assign(new Error('A student profile is required to submit feedback'), { statusCode: 403, code: 'STUDENT_PROFILE_REQUIRED' });
      const [forms] = await connection.execute(
        `SELECT id FROM feedback_forms WHERE id = ? AND status = 'active'
         AND (opens_at IS NULL OR opens_at <= UTC_TIMESTAMP())
         AND (closes_at IS NULL OR closes_at >= UTC_TIMESTAMP()) FOR UPDATE`,
        [formId],
      );
      if (!forms[0]) throw Object.assign(new Error('This feedback form is not currently open'), { statusCode: 422, code: 'FORM_CLOSED' });
      const [questions] = await connection.execute(
        `SELECT q.id, q.question_type, q.options, q.is_required
         FROM feedback_form_questions fq JOIN feedback_questions q ON q.id = fq.question_id
         WHERE fq.form_id = ? AND q.status = 'active'`,
        [formId],
      );
      validateAnswers(questions, answers);
      const [response] = await connection.execute(
        'INSERT INTO feedback_responses (form_id, student_id) VALUES (?, ?)',
        [formId, students[0].id],
      );
      for (const answer of answers) {
        await connection.execute(
          'INSERT INTO feedback_answers (response_id, question_id, rating_value, choice_value, text_value) VALUES (?, ?, ?, ?, ?)',
          [response.insertId, answer.question_id, answer.rating_value ?? null, answer.choice_value ?? null, answer.text_value ?? null],
        );
      }
      await connection.commit();
      return { id: response.insertId, form_id: Number(formId), submitted_at: new Date().toISOString() };
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') Object.assign(error, { statusCode: 409, code: 'DUPLICATE_SUBMISSION', message: 'Feedback has already been submitted for this form' });
      throw error;
    } finally {
      connection.release();
    }
  }

  async replaceAnswers(responseId, answers) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [responses] = await connection.execute('SELECT id, form_id FROM feedback_responses WHERE id = ? FOR UPDATE', [responseId]);
      if (!responses[0]) throw Object.assign(new Error('Feedback response not found'), { statusCode: 404, code: 'NOT_FOUND' });
      const [questions] = await connection.execute(
        `SELECT q.id, q.question_type, q.options, q.is_required
         FROM feedback_form_questions fq JOIN feedback_questions q ON q.id = fq.question_id
         WHERE fq.form_id = ? AND q.status = 'active'`, [responses[0].form_id]);
      validateAnswers(questions, answers);
      await connection.execute('DELETE FROM feedback_answers WHERE response_id = ?', [responseId]);
      for (const answer of answers) {
        await connection.execute(
          'INSERT INTO feedback_answers (response_id, question_id, rating_value, choice_value, text_value) VALUES (?, ?, ?, ?, ?)',
          [responseId, answer.question_id, answer.rating_value ?? null, answer.choice_value ?? null, answer.text_value ?? null],
        );
      }
      await connection.commit();
      return { id: Number(responseId), form_id: Number(responses[0].form_id), updated: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteResponse(responseId) {
    const [result] = await pool.execute('DELETE FROM feedback_responses WHERE id = ?', [responseId]);
    return result.affectedRows > 0;
  }
}