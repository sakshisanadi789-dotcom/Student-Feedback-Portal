export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Your role cannot perform this action', error: 'FORBIDDEN' });
    }
    return next();
  };
}