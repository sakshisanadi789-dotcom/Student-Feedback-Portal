import { pool } from '../config/database.js';

const identifier = (name) => `\`${name}\``;

export class ResourceRepository {
  constructor(database = pool) {
    this.database = database;
  }

  async list(spec, { page, limit, search, filters, sortBy, sortOrder }) {
    const where = [];
    const values = [];
    if (search) {
      where.push(`(${spec.search.map((column) => `LOWER(CAST(${identifier(column)} AS CHAR)) LIKE ?`).join(' OR ')})`);
      values.push(...spec.search.map(() => `%${search.toLowerCase()}%`));
    }
    for (const [column, value] of Object.entries(filters)) {
      where.push(`${identifier(column)} = ?`);
      values.push(value);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await this.database.execute(`SELECT COUNT(*) AS total FROM ${identifier(spec.table)} ${whereSql}`, values);
    const offset = (page - 1) * limit;
    const [rows] = await this.database.execute(
      `SELECT ${spec.columns.map(identifier).join(', ')} FROM ${identifier(spec.table)} ${whereSql} ORDER BY ${identifier(sortBy)} ${sortOrder} LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    );
    return { rows, total: Number(countRows[0].total) };
  }

  async findById(spec, id, connection = this.database) {
    const [rows] = await connection.execute(
      `SELECT ${spec.columns.map(identifier).join(', ')} FROM ${identifier(spec.table)} WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }

  async create(spec, data, connection = this.database) {
    const columns = Object.keys(data);
    const [result] = await connection.execute(
      `INSERT INTO ${identifier(spec.table)} (${columns.map(identifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map((column) => data[column]),
    );
    return this.findById(spec, result.insertId, connection);
  }

  async createForm(spec, data, questionIds = []) {
    const connection = await this.database.getConnection();
    try {
      await connection.beginTransaction();
      const form = await this.create(spec, data, connection);
      await this.replaceFormQuestions(connection, form.id, questionIds);
      await connection.commit();
      return form;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateForm(spec, id, data, questionIds) {
    const connection = await this.database.getConnection();
    try {
      await connection.beginTransaction();
      const form = Object.keys(data).length
        ? await this.update(spec, id, data, connection)
        : await this.findById(spec, id, connection);
      if (!form) return null;
      if (questionIds !== undefined) await this.replaceFormQuestions(connection, id, questionIds);
      await connection.commit();
      return form;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async replaceFormQuestions(connection, formId, questionIds) {
    const ids = [...new Set(questionIds.map(Number))];
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      throw Object.assign(new Error('Question IDs must be positive integers'), { statusCode: 422, code: 'VALIDATION_ERROR' });
    }
    if (ids.length) {
      const [questions] = await connection.query("SELECT id FROM feedback_questions WHERE id IN (?) AND status = 'active'", [ids]);
      if (questions.length !== ids.length) {
        throw Object.assign(new Error('One or more selected questions are unavailable'), { statusCode: 422, code: 'INVALID_QUESTION' });
      }
    }
    await connection.execute('DELETE FROM feedback_form_questions WHERE form_id = ?', [formId]);
    for (const [index, questionId] of ids.entries()) {
      await connection.execute('INSERT INTO feedback_form_questions (form_id, question_id, position) VALUES (?, ?, ?)', [formId, questionId, index + 1]);
    }
  }

  async update(spec, id, data, connection = this.database) {
    const columns = Object.keys(data);
    const [result] = await connection.execute(
      `UPDATE ${identifier(spec.table)} SET ${columns.map((column) => `${identifier(column)} = ?`).join(', ')} WHERE id = ?`,
      [...columns.map((column) => data[column]), id],
    );
    return result.affectedRows ? this.findById(spec, id, connection) : null;
  }

  async remove(spec, id) {
    const [result] = await this.database.execute(`DELETE FROM ${identifier(spec.table)} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}