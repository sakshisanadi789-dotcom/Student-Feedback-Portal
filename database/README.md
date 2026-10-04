# Database setup

1. Create a MySQL 8 database using `schema.sql` (the script creates `student_feedback_portal`).
2. Configure database credentials in the repository-root `.env` file.
3. Run `mysql -u root -p < database/seed.sql` to load roles, sample courses, teachers, questions, and active forms.
4. Create demo accounts using `npm run db:seed` from the repository root. The script generates bcrypt hashes at runtime and safely upserts the demo accounts and sample students.

The SQL seed is safe to run repeatedly. Demo user credentials are documented in the root README.