CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(24) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  department VARCHAR(120) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_status (status)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_role_status (role_id, status)
);

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL UNIQUE,
  student_code VARCHAR(32) NOT NULL UNIQUE,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  course_id BIGINT UNSIGNED NULL,
  enrollment_year SMALLINT UNSIGNED NULL,
  status ENUM('active', 'inactive', 'graduated') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_students_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  INDEX idx_students_course_status (course_id, status),
  INDEX idx_students_name (full_name)
);

CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL UNIQUE,
  employee_code VARCHAR(32) NOT NULL UNIQUE,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  department VARCHAR(120) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_teachers_department (department)
);

CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  subject_code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  term VARCHAR(40) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subjects_course FOREIGN KEY (course_id) REFERENCES courses(id),
  INDEX idx_subjects_course_status (course_id, status)
);

CREATE TABLE IF NOT EXISTS feedback_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  prompt VARCHAR(500) NOT NULL,
  question_type ENUM('rating', 'multiple_choice', 'text') NOT NULL,
  options JSON NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_questions_type_status (question_type, status)
);

CREATE TABLE IF NOT EXISTS feedback_forms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  opens_at DATETIME NULL,
  closes_at DATETIME NULL,
  status ENUM('draft', 'active', 'closed') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_forms_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_forms_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_forms_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_forms_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_forms_status_dates (status, opens_at, closes_at)
);

CREATE TABLE IF NOT EXISTS feedback_form_questions (
  form_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (form_id, question_id),
  CONSTRAINT fk_form_questions_form FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
  CONSTRAINT fk_form_questions_question FOREIGN KEY (question_id) REFERENCES feedback_questions(id),
  INDEX idx_form_questions_position (form_id, position)
);

CREATE TABLE IF NOT EXISTS feedback_responses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  form_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_responses_form FOREIGN KEY (form_id) REFERENCES feedback_forms(id),
  CONSTRAINT fk_responses_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT uq_response_student_form UNIQUE (form_id, student_id),
  INDEX idx_responses_submitted (submitted_at)
);

CREATE TABLE IF NOT EXISTS feedback_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  response_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  rating_value TINYINT UNSIGNED NULL,
  choice_value VARCHAR(255) NULL,
  text_value TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_answers_response FOREIGN KEY (response_id) REFERENCES feedback_responses(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES feedback_questions(id),
  CONSTRAINT chk_rating_range CHECK (rating_value IS NULL OR rating_value BETWEEN 1 AND 5),
  UNIQUE KEY uq_response_question (response_id, question_id),
  INDEX idx_answers_rating (rating_value)
);