import { mkdir, writeFile } from 'node:fs/promises';

const baseUrl = '{{baseUrl}}';
const auth = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };
const testEvents = [{ listen: 'test', script: { type: 'text/javascript', exec: [
  "pm.test('HTTP status is successful', () => pm.expect(pm.response.code).to.be.within(200, 299));",
  "pm.test('Response has the standard success flag', () => pm.expect(pm.response.json()).to.have.property('success', true));",
  "pm.test('Response includes a data field', () => pm.expect(pm.response.json()).to.have.property('data'));",
] } }];

function request(name, method, path, { body, query, authRequired = true, requiredFields, tests = testEvents } = {}) {
  const url = { raw: `${baseUrl}${path}${query?.length ? `?${query.map(([key, value]) => `${key}=${value}`).join('&')}` : ''}`, host: [baseUrl], path: path.split('/').filter(Boolean), ...(query?.length ? { query: query.map(([key, value]) => ({ key, value })) } : {}) };
  return {
    name,
    request: {
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      ...(authRequired ? { auth } : { auth: { type: 'noauth' } }),
      ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
      url,
    },
    event: requiredFields?.length ? [{ listen: 'test', script: { type: 'text/javascript', exec: [
      `pm.test('Request includes required fields: ${requiredFields.join(', ')}', () => pm.expect(JSON.parse(pm.request.body.raw)).to.include.all.keys(${requiredFields.map((field) => `'${field}'`).join(', ')}));`,
    ] } }, ...tests] : tests,
  };
}

function resourceFolder(label, path, idVar, example) {
  const id = `{{${idVar}}}`;
  const requiredByResource = {
    users: ['role_id', 'full_name', 'email', 'password'], students: ['student_code', 'full_name', 'email'],
    teachers: ['employee_code', 'full_name', 'email'], courses: ['course_code', 'name'],
    subjects: ['course_id', 'subject_code', 'name'], 'feedback-questions': ['prompt', 'question_type'],
    'feedback-forms': ['title', 'course_id', 'subject_id', 'teacher_id'], roles: ['name'],
  };
  return {
    name: label,
    item: [
      request('Get all · pagination', 'GET', `/${path}`, { query: [['page', '1'], ['limit', '10']] }),
      request('Search', 'GET', `/${path}`, { query: [['search', 'sample']] }),
      request('Filter', 'GET', `/${path}`, { query: [['status', 'active']] }),
      request('Sort', 'GET', `/${path}`, { query: [['sortBy', 'id'], ['sortOrder', 'desc']] }),
      request('Get by ID', 'GET', `/${path}/${id}`),
      request('Create', 'POST', `/${path}`, { body: example, requiredFields: requiredByResource[path] }),
      request('Update', 'PUT', `/${path}/${id}`, { body: example, requiredFields: requiredByResource[path] }),
      request('Patch', 'PATCH', `/${path}/${id}`, { body: example, requiredFields: requiredByResource[path] }),
      request('Delete', 'DELETE', `/${path}/${id}`),
    ],
  };
}

const loginTests = [{ listen: 'test', script: { type: 'text/javascript', exec: [
  "pm.test('Login succeeds', () => pm.expect(pm.response.code).to.equal(200));",
  "const payload = pm.response.json();",
  "pm.test('Token is returned', () => pm.expect(payload.data.token).to.be.a('string').and.not.empty);",
  "pm.environment.set('token', payload.data.token);",
  "pm.environment.set('userId', String(payload.data.user.id));",
] } }];

const folders = [
  { name: '01 - Authentication', item: [
    request('Register student', 'POST', '/auth/register', { authRequired: false, body: { full_name: 'Taylor Sample', email: 'taylor.sample@example.edu', password: 'SamplePass@123' }, tests: [{ listen: 'test', script: { type: 'text/javascript', exec: ["pm.test('Registration returns a created response', () => pm.expect(pm.response.code).to.be.oneOf([201, 409]));"] } }] }),
    request('Login', 'POST', '/auth/login', { authRequired: false, body: { email: 'admin@northstar.edu', password: 'Campus@2026' }, tests: loginTests }),
    request('Current user', 'GET', '/auth/me'),
    request('Logout', 'POST', '/auth/logout'),
  ] },
  { name: '02 - Users', item: [
    resourceFolder('User CRUD and query options', 'users', 'userId', { role_id: 3, full_name: 'Taylor Sample', email: 'taylor.sample@example.edu', password: 'SamplePass@123', status: 'active' }),
    resourceFolder('Role CRUD and query options', 'roles', 'roleId', { name: 'reviewer', description: 'Read-only review access' }),
    request('Required fields validation', 'POST', '/students', { body: {}, tests: [{ listen: 'test', script: { type: 'text/javascript', exec: [
      "pm.test('Missing required fields return 422', () => pm.expect(pm.response.code).to.equal(422));",
      "pm.test('Validation error uses standard error response', () => pm.expect(pm.response.json()).to.include({ success: false, error: 'VALIDATION_ERROR' }));",
    ] } }] }),
  ] },
  { name: '03 - Dashboard', item: [request('Dashboard summary', 'GET', '/dashboard')] },
  { name: '04 - Students', item: [resourceFolder('Student CRUD and query options', 'students', 'studentId', { student_code: 'STU-30001', full_name: 'Taylor Sample', email: 'taylor.sample@example.edu', course_id: 1, enrollment_year: 2026, status: 'active' })] },
  { name: '05 - Teachers', item: [resourceFolder('Teacher CRUD and query options', 'teachers', 'teacherId', { employee_code: 'EMP-1300', full_name: 'Morgan Sample', email: 'morgan.sample@northstar.edu', department: 'Computer Science', status: 'active' })] },
  { name: '06 - Courses', item: [resourceFolder('Course CRUD and query options', 'courses', 'courseId', { course_code: 'EDU-BA', name: 'Education Studies', department: 'School of Education', status: 'active' })] },
  { name: '07 - Subjects', item: [resourceFolder('Subject CRUD and query options', 'subjects', 'subjectId', { course_id: 1, subject_code: 'CS-401', name: 'Responsible Computing', term: 'Year 4 · Term 1', status: 'active' })] },
  { name: '08 - Feedback Questions', item: [resourceFolder('Question CRUD and query options', 'feedback-questions', 'questionId', { prompt: 'How useful were the learning materials?', question_type: 'rating', is_required: true, status: 'active' })] },
  { name: '09 - Feedback Forms', item: [
    resourceFolder('Form CRUD and query options', 'feedback-forms', 'formId', { title: 'Spring feedback check-in', description: 'Share feedback on this class.', course_id: 1, subject_id: 1, teacher_id: 1, status: 'draft', question_ids: [1, 2, 3] }),
    request('Get form questions', 'GET', '/feedback-forms/{{formId}}/questions'),
    request('Replace form questions', 'PUT', '/feedback-forms/{{formId}}/questions', { body: { question_ids: [1, 2, 3] } }),
  ] },
  { name: '10 - Feedback Responses', item: [
    request('Get all responses', 'GET', '/feedback-responses', { query: [['page', '1'], ['limit', '10']] }),
    request('Get response by ID', 'GET', '/feedback-responses/{{responseId}}'),
    request('Submit feedback', 'POST', '/feedback-responses', { body: { form_id: 1, answers: [{ question_id: 1, rating_value: 5 }, { question_id: 2, choice_value: 'About right' }, { question_id: 3, text_value: 'The examples were helpful.' }] } }),
    request('Replace response answers', 'PUT', '/feedback-responses/{{responseId}}', { body: { answers: [{ question_id: 1, rating_value: 4 }, { question_id: 2, choice_value: 'About right' }] } }),
    request('Patch response answers', 'PATCH', '/feedback-responses/{{responseId}}', { body: { answers: [{ question_id: 1, rating_value: 4 }, { question_id: 2, choice_value: 'About right' }] } }),
    request('Delete response', 'DELETE', '/feedback-responses/{{responseId}}'),
  ] },
  { name: '11 - Reports', item: [
    request('Feedback report · all dimensions', 'GET', '/reports/feedback'),
    request('Teacher-wise report', 'GET', '/reports/feedback', { query: [['teacher_id', '1']] }),
    request('Subject-wise report', 'GET', '/reports/feedback', { query: [['subject_id', '1']] }),
    request('Course-wise report', 'GET', '/reports/feedback', { query: [['course_id', '1']] }),
  ] },
];

const collection = {
  info: {
    name: 'Student Feedback Portal API',
    description: 'REST API coverage for authentication, academic records, feedback forms, submissions, dashboards, and reports. Import the matching environment, run the login request first, then use the captured JWT for protected requests.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth,
  variable: [{ key: 'baseUrl', value: 'http://localhost:5000/api' }],
  item: folders,
};

const environment = {
  name: 'Student Feedback Portal · Local',
  values: [
    ['baseUrl', 'http://localhost:5000/api'], ['token', ''], ['userId', ''], ['studentId', '1'], ['teacherId', '1'],
    ['courseId', '1'], ['subjectId', '1'], ['questionId', '1'], ['formId', '1'], ['responseId', '1'], ['roleId', '1'],
  ].map(([key, value]) => ({ key, value, type: 'default', enabled: true })),
  _postman_variable_scope: 'environment',
};

await mkdir(new URL('../../postman/', import.meta.url), { recursive: true });
await writeFile(new URL('../../postman/student-feedback-portal.postman_collection.json', import.meta.url), `${JSON.stringify(collection, null, 2)}\n`);
await writeFile(new URL('../../postman/environment.json', import.meta.url), `${JSON.stringify(environment, null, 2)}\n`);
console.info(`Generated ${folders.length} Postman folders.`);