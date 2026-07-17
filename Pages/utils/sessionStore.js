const crypto = require('crypto');
const sessions = new Map();
function createSession(user) { const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, user); return token; }
function getUser(token) { return sessions.get(token); }
function destroySession(token) { sessions.delete(token); }
module.exports = { createSession, getUser, destroySession };
