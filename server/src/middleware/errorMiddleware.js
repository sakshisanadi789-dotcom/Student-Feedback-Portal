export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found', error: 'NOT_FOUND' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const statusCode = Number(error.statusCode) || 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : error.message || 'An unexpected error occurred';
  res.status(statusCode).json({
    success: false,
    message,
    error: error.code || 'INTERNAL_ERROR',
  });
}