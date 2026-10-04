import { Router } from 'express';
import { create, get, list, remove, update } from '../controllers/resourceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { resourceNames } from '../models/resourceDefinitions.js';

const router = Router();
const writers = ['admin', 'manager'];
const adminOnly = ['admin'];
const readers = {
  users: adminOnly,
  roles: adminOnly,
  students: ['admin', 'manager', 'staff'],
  teachers: ['admin', 'manager', 'staff'],
  courses: ['admin', 'manager', 'staff'],
  subjects: ['admin', 'manager', 'staff'],
  'feedback-questions': ['admin', 'manager', 'staff'],
  'feedback-forms': ['admin', 'manager', 'staff', 'teacher', 'student'],
  'feedback-responses': ['admin', 'manager', 'staff'],
};

for (const resource of resourceNames) {
  const path = `/${resource}`;
  const writeRoles = ['users', 'roles'].includes(resource) ? adminOnly : writers;
  router.get(path, authenticateToken, authorizeRoles(...(readers[resource] || [])), list(resource));
  router.get(`${path}/:id`, authenticateToken, authorizeRoles(...(readers[resource] || [])), get(resource));
  router.post(path, authenticateToken, authorizeRoles(...writeRoles), create(resource));
  router.put(`${path}/:id`, authenticateToken, authorizeRoles(...writeRoles), update(resource));
  router.patch(`${path}/:id`, authenticateToken, authorizeRoles(...writeRoles), update(resource));
  router.delete(`${path}/:id`, authenticateToken, authorizeRoles(...writeRoles), remove(resource));
}

export default router;