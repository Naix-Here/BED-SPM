const crypto = require('crypto');
const AppError = require('../utils/AppError');
const users = require('../models/userModel');
const sessions = require('../utils/sessionStore');
const hash = password => crypto.createHash('sha256').update(password, 'utf8').digest('hex');
async function login(req, res) { const { email, password } = req.body; if (!email || !password) throw new AppError('Email and password are required.', 400); const record = await users.findByCredentials(email.trim(), hash(password)); if (!record) throw new AppError('Incorrect email or password.', 401); const user = { id: record.UserId, name: record.FullName, email: record.Email, role: record.Role }; res.json({ token: sessions.createSession(user), user }); }
async function register(req, res) { const { name, email, password } = req.body; if (!name || !email || !password) throw new AppError('Name, email and password are required.', 400); if (password.length < 8) throw new AppError('Password must be at least 8 characters.', 400); const user = await users.createPatron(name.trim(), email.trim(), hash(password)); res.status(201).json({ message: 'Account created. You can now log in.', userId: user.UserId }); }
function logout(req, res) { sessions.destroySession(req.token); res.json({ message: 'Logged out. You are now browsing as a guest.' }); }
function me(req, res) { res.json({ user: req.user }); }
module.exports = { login, register, logout, me };
