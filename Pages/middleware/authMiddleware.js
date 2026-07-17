const AppError = require('../utils/AppError');
const sessions = require('../utils/sessionStore');
function requireLogin(req, res, next) { const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, ''); const user = sessions.getUser(token); if (!user) return next(new AppError('Please log in to continue.', 401)); req.token = token; req.user = user; next(); }
function requirePatron(req, res, next) { if (req.user.role !== 'patron') return next(new AppError('This page is available to patrons only.', 403)); next(); }
module.exports = { requireLogin, requirePatron };
