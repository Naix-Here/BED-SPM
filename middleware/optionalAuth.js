// Like verifyToken, but never rejects the request.
// If a valid Bearer token is present, req.user is populated.
// If no token / an invalid token is present, the request still proceeds
// (guests are allowed). Use this on routes whose controllers can serve
// both authenticated users and guests (e.g. the cart endpoints, which
// identify guests via the `x-session-id` header).
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shcms_super_secret_key_2026';

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    // Ignore invalid tokens for optional auth — treat as guest
  }
  next();
}

module.exports = optionalAuth;
