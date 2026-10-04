import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ResourceService } from '../src/services/resourceService.js';

test('list clamps pagination and only accepts whitelisted sorting and filters', async () => {
  let received;
  const repository = {
    async list(spec, query) {
      received = { spec, query };
      return { rows: [], total: 0 };
    },
  };
  const service = new ResourceService(repository);
  const result = await service.list('students', {
    page: '-2', limit: '10000', search: 'Avery', sortBy: 'email; DROP TABLE users', sortOrder: 'DESC',
    status: 'active', unexpected: 'ignored',
  });
  assert.equal(received.query.page, 1);
  assert.equal(received.query.limit, 100);
  assert.equal(received.query.sortBy, 'id');
  assert.equal(received.query.sortOrder, 'DESC');
  assert.deepEqual(received.query.filters, { status: 'active' });
  assert.equal(result.pagination.totalPages, 0);
});

test('unknown resources return a standard not-found error', async () => {
  const service = new ResourceService({});
  await assert.rejects(() => service.list('not-a-resource', {}), { statusCode: 404, code: 'NOT_FOUND' });
});

test('multiple-choice questions require at least two non-empty options', async () => {
  const service = new ResourceService({ create: async () => ({ id: 1 }) });
  await assert.rejects(
    () => service.create('feedback-questions', { prompt: 'Choose one', question_type: 'multiple_choice', options: '["Only one"]' }),
    { statusCode: 422, code: 'VALIDATION_ERROR' },
  );
});