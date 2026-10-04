import { ResourceService } from '../services/resourceService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const service = new ResourceService();

export const list = (resource) => asyncHandler(async (req, res) => {
  const result = await service.list(resource, req.query);
  res.json({ success: true, message: `${resource} retrieved successfully`, ...result });
});

export const get = (resource) => asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Record retrieved successfully', data: await service.get(resource, req.params.id) });
});

export const create = (resource) => asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Record created successfully', data: await service.create(resource, req.body) });
});

export const update = (resource) => asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Record updated successfully', data: await service.update(resource, req.params.id, req.body) });
});

export const remove = (resource) => asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Record deleted successfully', data: await service.remove(resource, req.params.id) });
});