// middleware/checkRole.js — Role-based authorization middleware.
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = checkRole;
