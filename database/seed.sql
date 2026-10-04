USE student_feedback_portal;

INSERT INTO roles (id, name, description) VALUES
  (1, 'admin', 'Full system administration'),
  (2, 'manager', 'Academic operations and reporting'),
  (3, 'staff', 'Read and manage assigned academic data'),
  (4, 'teacher', 'View own teaching feedback'),
  (5, 'student', 'Submit course feedback')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO courses (id, course_code, name, department) VALUES
  (1, 'CS-BS', 'Computer Science', 'School of Computing'),
  (2, 'DS-BS', 'Data Science', 'School of Computing'),
  (3, 'UX-BA', 'Interaction Design', 'School of Design')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO subjects (id, course_id, subject_code, name, term) VALUES
  (1, 1, 'CS204', 'Data Structures', 'Year 2 · Term 1'),
  (2, 1, 'CS318', 'Human-Computer Interaction', 'Year 3 · Term 1'),
  (3, 2, 'DS210', 'Statistical Learning', 'Year 2 · Term 2'),
  (4, 3, 'UX115', 'Interface Systems', 'Year 1 · Term 2')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teachers (id, employee_code, full_name, email, department) VALUES
  (1, 'EMP-1042', 'Dr. Amara Okafor', 'amara.okafor@northstar.edu', 'Computer Science'),
  (2, 'EMP-1088', 'Prof. Leo Chen', 'leo.chen@northstar.edu', 'Data Science'),
  (3, 'EMP-1121', 'Mira Patel', 'mira.patel@northstar.edu', 'Interaction Design')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO feedback_questions (id, prompt, question_type, options, is_required) VALUES
  (1, 'How clearly did the instructor explain the material?', 'rating', NULL, TRUE),
  (2, 'How would you describe the pace of the course?', 'multiple_choice', JSON_ARRAY('Too slow', 'About right', 'Too fast'), TRUE),
  (3, 'What is one thing that would improve this course?', 'text', NULL, FALSE),
  (4, 'The course materials supported my learning.', 'rating', NULL, TRUE),
  (5, 'How comfortable did you feel asking questions?', 'rating', NULL, TRUE)
ON DUPLICATE KEY UPDATE prompt = VALUES(prompt);

INSERT INTO feedback_forms (id, title, description, course_id, subject_id, teacher_id, opens_at, closes_at, status) VALUES
  (1, 'Spring teaching pulse', 'A short, anonymous check-in on this term’s learning experience.', 1, 1, 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 14 DAY), 'active'),
  (2, 'Design studio review', 'Share feedback on studio teaching and critique sessions.', 3, 4, 3, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 18 DAY), 'active'),
  (3, 'Statistical learning check-in', 'Help us improve examples and practice materials.', 2, 3, 2, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 20 DAY), 'active')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO feedback_form_questions (form_id, question_id, position) VALUES
  (1, 1, 1), (1, 2, 2), (1, 3, 3),
  (2, 1, 1), (2, 4, 2), (2, 3, 3),
  (3, 1, 1), (3, 4, 2), (3, 5, 3)
ON DUPLICATE KEY UPDATE position = VALUES(position);