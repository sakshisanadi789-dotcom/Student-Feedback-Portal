import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

const demoAccounts = [
  { role: 'admin', name: 'Avery Morgan', email: 'admin@northstar.edu', password: 'Campus@2026' },
  { role: 'manager', name: 'Jordan Ellis', email: 'manager@northstar.edu', password: 'Campus@2026' },
  { role: 'staff', name: 'Riley Brooks', email: 'staff@northstar.edu', password: 'Campus@2026' },
  { role: 'teacher', name: 'Dr. Amara Okafor', email: 'amara.okafor@northstar.edu', password: 'Campus@2026' },
  { role: 'student', name: 'Sofia Reyes', email: 'student@northstar.edu', password: 'Campus@2026' },
];

async function seed() {
  for (const account of demoAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    const [rows] = await pool.execute('SELECT id FROM roles WHERE name = ?', [account.role]);
    if (!rows[0]) throw new Error(`Required role is missing: ${account.role}. Run database/seed.sql first.`);
    await pool.execute(
      `INSERT INTO users (role_id, full_name, email, password_hash, status)
       VALUES (?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), full_name = VALUES(full_name), password_hash = VALUES(password_hash), status = 'active'`,
      [rows[0].id, account.name, account.email, passwordHash],
    );
  }

  const [[studentUser]] = await pool.execute('SELECT id FROM users WHERE email = ?', ['student@northstar.edu']);
  await pool.execute(
    `INSERT INTO students (user_id, student_code, full_name, email, course_id, enrollment_year, status)
     VALUES (?, 'STU-20418', 'Sofia Reyes', 'student@northstar.edu', 1, 2024, 'active')
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), full_name = VALUES(full_name), course_id = VALUES(course_id), status = 'active'`,
    [studentUser.id],
  );

  const [[teacherUser]] = await pool.execute('SELECT id FROM users WHERE email = ?', ['amara.okafor@northstar.edu']);
  await pool.execute('UPDATE teachers SET user_id = ? WHERE email = ?', [teacherUser.id, 'amara.okafor@northstar.edu']);

  const [[student]] = await pool.execute('SELECT id FROM students WHERE email = ?', ['student@northstar.edu']);
  const [[existing]] = await pool.execute('SELECT id FROM feedback_responses WHERE form_id = 1 AND student_id = ?', [student.id]);
  let responseId = existing?.id;
  if (!responseId) {
    const [response] = await pool.execute('INSERT INTO feedback_responses (form_id, student_id) VALUES (1, ?)', [student.id]);
    responseId = response.insertId;
    await pool.execute(
      `INSERT INTO feedback_answers (response_id, question_id, rating_value, choice_value, text_value) VALUES
       (?, 1, 5, NULL, NULL),
       (?, 2, NULL, 'About right', NULL),
       (?, 3, NULL, NULL, 'The worked examples made a challenging topic feel approachable.')`,
      [responseId, responseId, responseId],
    );
  }
  console.info('Demo roles, users, student profile, and sample feedback are ready.');
}

seed().catch((error) => {
  console.error('Demo seed failed:', error.message);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});