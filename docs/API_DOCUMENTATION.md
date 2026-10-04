# Student Feedback Portal API

Base URL: `http://localhost:5000/api`

Protected requests use `Authorization: Bearer <JWT>`. JSON responses use `{ "success", "message", "data" }`; list responses also include `pagination`. Errors use `{ "success": false, "message", "error" }`.

## Roles

| Role | Access |
| --- | --- |
| `admin` | Full administration, users, roles, academic data, and reports |
| `manager` | Academic data, forms, questions, submissions, and reports; cannot administer users/roles |
| `staff` | Read academic records, forms, questions, and anonymized response metadata |
| `teacher` | View forms and reports scoped to their own teacher profile |
| `student` | View active feedback forms, check own submission state, and submit feedback |

## Common behavior

List endpoints accept `page` (default 1), `limit` (default 10, max 100), `search`, supported resource-specific filter fields, `sortBy`, and `sortOrder` (`asc` or `desc`). Unsupported sort fields fall back to `id`; unknown filter parameters are ignored. Search and filters use parameterized SQL.

```http
GET /api/students?page=1&limit=10&search=sofia&course_id=1&status=active&sortBy=full_name&sortOrder=asc
Authorization: Bearer <JWT>
```

```json
{
  "success": true,
  "message": "students retrieved successfully",
  "data": [],
  "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

## Authentication

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Register a student account and profile | Public |
| `POST` | `/auth/login` | Verify credentials and return JWT/user | Public |
| `POST` | `/auth/logout` | Client-session logout acknowledgement | Authenticated |
| `GET` | `/auth/me` | Return the current token identity | Authenticated |

Register body: `{ "full_name": "Taylor Sample", "email": "taylor@example.edu", "password": "AtLeast8Chars" }`.

Login body: `{ "email": "admin@northstar.edu", "password": "Campus@2026" }`. Success returns `data.token` and `data.user`. Logout is stateless; clients must discard their token. Use short expirations and a revocation/session store before production deployment.

## Academic and administration resources

Each resource below exposes `GET /api/{resource}`, `GET /api/{resource}/:id`, `POST /api/{resource}`, `PUT /api/{resource}/:id`, `PATCH /api/{resource}/:id`, and `DELETE /api/{resource}/:id`, subject to role access. `POST` returns `201`; successful reads/updates/deletes return `200`. Delete may return `409 RECORD_IN_USE` when foreign keys protect related records.

| Resource | Role access | Writable fields |
| --- | --- | --- |
| `/students` | Admin, manager, staff read; admin/manager write | `student_code`, `full_name`, `email`, `course_id`, `enrollment_year`, `status` |
| `/teachers` | Admin, manager, staff read; admin/manager write | `employee_code`, `full_name`, `email`, `department`, `status` |
| `/courses` | Admin, manager, staff read; admin/manager write | `course_code`, `name`, `department`, `status` |
| `/subjects` | Admin, manager, staff read; admin/manager write | `course_id`, `subject_code`, `name`, `term`, `status` |
| `/feedback-questions` | Admin, manager, staff read; admin/manager write | `prompt`, `question_type`, `options`, `is_required`, `status` |
| `/feedback-forms` | Admin, manager, staff, teacher, student read; admin/manager write | `title`, `description`, `course_id`, `subject_id`, `teacher_id`, `opens_at`, `closes_at`, `status`, `question_ids` |
| `/users` | Admin only | `role_id`, `full_name`, `email`, `password`, `status` |
| `/roles` | Admin only | `name`, `description` |
| `/feedback-responses` | Admin, manager, staff read; students submit; admin/manager replace answers; admin deletes | `form_id`, `answers` on `POST`; `answers` on `PUT`/`PATCH` |

Email values are validated, duplicate unique fields return `409`, invalid references return `422`, and user list/detail responses never contain password hashes. `rating` questions use integer values 1 through 5, `multiple_choice` questions use an `options` JSON array, and `text` questions accept written feedback.

Supported filters include `course_id`, `subject_id`, `teacher_id`, `role_id`, `status`, `department`, `term`, `enrollment_year`, `question_type`, and `is_required` where relevant. Sort fields are restricted per resource.

### Feedback form questions

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/feedback-forms/:id/questions` | List configured questions in order | Authenticated |
| `PUT` | `/feedback-forms/:id/questions` | Replace form question mapping | Admin, manager |

Standard feedback-form `POST` and `PUT` bodies may include `question_ids: [1, 2, 3]`. Form data and question mappings are committed in one transaction. The mapping endpoint accepts `{ "question_ids": [1, 2, 3] }`.

## Feedback submission

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/feedback-forms/:id/my-response` | Check whether the signed-in student submitted the form | Student |
| `POST` | `/feedback-responses` | Submit one response and its answers atomically | Student |
| `GET` | `/feedback-responses` | List response metadata without student identifiers | Admin, manager, staff |
| `GET` | `/feedback-responses/:id` | Retrieve response metadata | Admin, manager, staff |
| `PUT` | `/feedback-responses/:id` | Replace all answers after type/required validation | Admin, manager |
| `PATCH` | `/feedback-responses/:id` | Replace all answers after type/required validation | Admin, manager |
| `DELETE` | `/feedback-responses/:id` | Delete response and cascade its answers | Admin |

Example submission:

```json
{
  "form_id": 1,
  "answers": [
    { "question_id": 1, "rating_value": 5 },
    { "question_id": 2, "choice_value": "About right" },
    { "question_id": 3, "text_value": "The worked examples were helpful." }
  ]
}
```

The form must be active and within its open/close window. Every required question must be answered with a value matching its type. A unique `(form_id, student_id)` constraint prevents duplicate submissions; duplicates return `409 DUPLICATE_SUBMISSION`. Any invalid answer rolls back the whole operation. Response reads omit student identifiers. Administrative answer replacement is transactional and replaces the complete answer set; it does not change the original submitter or form.

## Dashboard and reports

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/dashboard` | Active student/teacher/form counts, response count, average rating, response trend, and teacher ratings | Admin, manager, staff |
| `GET` | `/reports/feedback` | Aggregated teacher/subject/course response and rating summary | Admin, manager, teacher |

Report filters: `teacher_id`, `subject_id`, and `course_id`. Teacher-role requests are restricted to the teacher linked to the JWT user, regardless of supplied filters. Reports aggregate ratings and do not return student identities or raw answer records.

## Status and error codes

| HTTP | Meaning | Common error codes |
| --- | --- | --- |
| `200` | Successful read/update/delete | |
| `201` | Created/submitted | |
| `400` | Malformed request | |
| `401` | Missing, invalid, or expired JWT | `UNAUTHENTICATED`, `INVALID_TOKEN` |
| `403` | Role or student-profile restriction | `FORBIDDEN`, `STUDENT_PROFILE_REQUIRED` |
| `404` | Unknown route or record | `NOT_FOUND` |
| `409` | Duplicate record/submission or record in use | `DUPLICATE_RECORD`, `DUPLICATE_SUBMISSION`, `RECORD_IN_USE` |
| `422` | Invalid fields, references, or answers | `VALIDATION_ERROR`, `INVALID_REFERENCE`, `FORM_CLOSED`, `ANSWER_REQUIRED` |
| `500` | Unexpected server/database failure | `INTERNAL_ERROR` |

## Health

`GET /api/health` is public and returns API process status. Database connectivity is checked during startup and can be verified by MySQL-backed dashboard/resource endpoints.