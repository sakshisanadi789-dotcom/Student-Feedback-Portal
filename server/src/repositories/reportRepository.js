import { pool } from '../config/database.js';

export class ReportRepository {
  async dashboard() {
    const [[students], [teachers], [forms], [responses], [average], [recent]] = await Promise.all([
      pool.execute("SELECT COUNT(*) AS total FROM students WHERE status = 'active'"),
      pool.execute("SELECT COUNT(*) AS total FROM teachers WHERE status = 'active'"),
      pool.execute(`SELECT COUNT(*) AS total FROM feedback_forms WHERE status = 'active'
            AND (opens_at IS NULL OR opens_at <= UTC_TIMESTAMP())
            AND (closes_at IS NULL OR closes_at >= UTC_TIMESTAMP())`),
      pool.execute('SELECT COUNT(*) AS total FROM feedback_responses'),
      pool.execute('SELECT ROUND(AVG(rating_value), 2) AS average FROM feedback_answers WHERE rating_value IS NOT NULL'),
      pool.execute(`SELECT DATE_FORMAT(submitted_at, '%b %e') AS label, COUNT(*) AS responses
                    FROM feedback_responses WHERE submitted_at >= UTC_DATE() - INTERVAL 6 DAY
                    GROUP BY DATE(submitted_at), label ORDER BY DATE(submitted_at)`),
    ]);
    const [teachersByRating] = await pool.execute(`
      SELECT t.full_name AS teacher, ROUND(AVG(a.rating_value), 2) AS rating, COUNT(DISTINCT fr.id) AS responses
      FROM feedback_answers a
      JOIN feedback_responses fr ON fr.id = a.response_id
      JOIN feedback_forms f ON f.id = fr.form_id
      JOIN teachers t ON t.id = f.teacher_id
      WHERE a.rating_value IS NOT NULL
      GROUP BY t.id, t.full_name ORDER BY rating DESC LIMIT 6`);
    return {
      totals: { students: students[0].total, teachers: teachers[0].total, forms: forms[0].total, responses: responses[0].total, averageRating: average[0].average || 0 },
      responseTrend: recent,
      teachersByRating,
    };
  }

  async summary(filters = {}, user) {
    const where = [];
    const values = [];
    for (const column of ['teacher_id', 'subject_id', 'course_id']) {
      if (filters[column]) {
        where.push(`f.${column} = ?`);
        values.push(filters[column]);
      }
    }
    if (user?.role === 'teacher') {
      where.push('f.teacher_id = (SELECT id FROM teachers WHERE user_id = ?)');
      values.push(user.id);
    }
    const whereSql = where.length ? `AND ${where.join(' AND ')}` : '';
    const [rows] = await pool.execute(`
            SELECT t.full_name AS teacher, s.name AS subject, c.name AS course,
              COUNT(DISTINCT fr.id) AS responses, ROUND(AVG(a.rating_value), 2) AS average_rating
      FROM feedback_forms f
      JOIN teachers t ON t.id = f.teacher_id
      JOIN subjects s ON s.id = f.subject_id
      JOIN courses c ON c.id = f.course_id
      LEFT JOIN feedback_responses fr ON fr.form_id = f.id
      LEFT JOIN feedback_answers a ON a.response_id = fr.id AND a.rating_value IS NOT NULL
      WHERE 1 = 1 ${whereSql}
      GROUP BY f.id, t.full_name, s.name, c.name ORDER BY average_rating DESC`, values);
    return rows;
  }
}