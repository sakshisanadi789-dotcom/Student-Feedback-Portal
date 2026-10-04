# Student Feedback Portal

A full-stack academic feedback workspace for managing students, teachers, courses, subjects, feedback forms, and anonymous teaching feedback. The project pairs a React administration portal with a layered Express API and a MySQL 8 data model.

## Features

- JWT authentication, bcrypt password hashing, and role-based access for admin, manager, staff, teacher, and student users.
- Academic record management with search, filters, sorting, pagination, validation, and protected CRUD APIs.
- Reusable rating, multiple-choice, and written-response questions.
- Scheduled feedback forms with question assignment and one submission per student per form.
- Transactional feedback submission and transactional form/question updates.
- Dashboard metrics, response activity, teacher ratings, and teacher-, subject-, and course-wise reports.
- Responsive React CMS and a student feedback submission workspace.
- MySQL schema and fictional demo records, Postman collection/environment, and API tests.

## Technology

React 18, Vite, Express 4, Node.js 20+, MySQL 8, `mysql2`, JWT, `bcryptjs`, Zod, Postman, and Node's built-in test runner with Supertest.

## Architecture

```text
React client -> REST routes -> middleware -> controllers -> services -> repositories -> MySQL
```

Routes map endpoints. Middleware handles authentication, authorization, and errors. Controllers translate HTTP input/output. Services own validation and business rules. Repositories contain parameterized SQL. Models define resource metadata and database entities. Multi-record feedback/form operations use MySQL transactions.

## Project layout

```text
client/src/       React components, screens, styles, and API client
server/src/config Environment validation and MySQL connection pool
server/src/models Resource definitions
server/src/routes Express endpoint definitions
server/src/middleware Authentication, RBAC, and error handling
server/src/controllers HTTP request/response handlers
server/src/services Business logic
server/src/repositories Parameterized SQL access
server/test/     API and service tests
database/        MySQL schema, seed data, and setup notes
docs/            API reference
postman/         Postman collection and local environment
```

## Requirements

- Node.js 20 or newer and npm 10 or newer.
- MySQL 8 running locally or reachable from the API host.

## Installation and database setup

1. Install dependencies from the repository root:

	```sh
	npm install
	```

2. Copy `.env.example` to `.env` and set the MySQL credentials. Set `JWT_SECRET` to a random private value outside local development.
3. Create the schema and load academic sample records:

	```sh
	mysql -u root -p < database/schema.sql
	mysql -u root -p < database/seed.sql
	```

4. Create bcrypt-hashed demo users, linked student/teacher profiles, and one sample response:

	```sh
	npm run db:seed
	```

The API reads the repository-root `.env`. The client defaults to `http://localhost:5000/api`; override `VITE_API_URL` in `.env` if needed.

## Run the application

Start the API and React client together:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:5000](http://localhost:5000), with a health check at `/api/health`.

To start either side independently, use `npm run dev:server` or `npm run dev:client`. Build the client with `npm run build`.

## Demo accounts

Run the SQL seed and `npm run db:seed` before signing in. All demo accounts use the password `Campus@2026`:

| Role | Email |
| --- | --- |
| Admin | `admin@northstar.edu` |
| Manager | `manager@northstar.edu` |
| Staff | `staff@northstar.edu` |
| Teacher | `amara.okafor@northstar.edu` |
| Student | `student@northstar.edu` |

Demo credentials are for local development only. Seed passwords are hashed with bcrypt; API responses never include password hashes.

## API documentation and Postman

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md). Import [postman/student-feedback-portal.postman_collection.json](postman/student-feedback-portal.postman_collection.json) and [postman/environment.json](postman/environment.json) into Postman. Select the local environment, run **01 - Authentication / Login**, then use the captured bearer token for protected requests. The collection includes resource CRUD/query variants, form-question assignment, feedback submission, dashboard, and reports.

## Tests

```sh
npm test
npm run build
```

API/service tests do not require a running MySQL instance. End-to-end database flows require the schema and seed setup above.

## Screenshots

Add product screenshots here after running the local application.

## Future enhancements

- Add audit events and managed refresh-token/session revocation.
- Add CSV/PDF report export and configurable response anonymity thresholds.
- Add course enrollment management, question branching, and email invitations.
- Add end-to-end browser tests and migration tooling for production deployments.