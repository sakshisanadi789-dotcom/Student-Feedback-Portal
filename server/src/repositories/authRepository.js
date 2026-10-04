import { pool } from '../config/database.js';

export class AuthRepository {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.role_id, u.full_name, u.email, u.password_hash, u.status, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? LIMIT 1`,
      [email],
    );
    return rows[0] || null;
  }

  async createStudent({ fullName, email, passwordHash }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [roles] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['student']);
      if (!roles[0]) throw Object.assign(new Error('Student role is not configured'), { statusCode: 500, code: 'ROLE_NOT_CONFIGURED' });
      const [user] = await connection.execute(
        'INSERT INTO users (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
        [roles[0].id, fullName, email, passwordHash],
      );
      const studentCode = `STU-${String(user.insertId).padStart(5, '0')}`;
      await connection.execute(
        'INSERT INTO students (user_id, student_code, full_name, email, status) VALUES (?, ?, ?, ?, ?)',
        [user.insertId, studentCode, fullName, email, 'active'],
      );
      await connection.commit();
      return { id: user.insertId, full_name: fullName, email, role: 'student' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}