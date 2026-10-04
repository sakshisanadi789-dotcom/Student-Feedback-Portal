import { AppError } from '../utils/appError.js';

export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return next(new AppError(details.join('; '), 422, 'VALIDATION_ERROR'));
    }
    req[target] = result.data;
    return next();
  };
}