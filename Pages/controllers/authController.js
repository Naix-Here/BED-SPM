const crypto = require('crypto');
const AppError = require('../utils/AppError');
const users = require('../models/userModel');
const sessions = require('../utils/sessionStore');
const { google } = require('googleapis');
const hash = password => crypto.createHash('sha256').update(password, 'utf8').digest('hex');
const googleStates = new Map();
const googleSignups = new Map();
const GOOGLE_SIGNUP_TTL = 10 * 60 * 1000;

function getGoogleClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new AppError('Google sign-in is not configured. Add the Google OAuth values to .env.', 503);
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function googleLogin(req, res) {
  const state = crypto.randomBytes(32).toString('hex');
  googleStates.set(state, Date.now());
  const client = getGoogleClient();
  res.redirect(client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'],
    state
  }));
}

async function googleCallback(req, res) {
  const { code, state, error } = req.query;
  const createdAt = googleStates.get(state);
  googleStates.delete(state);
  if (error) throw new AppError('Google sign-in was cancelled or denied.', 400);
  if (!code || !createdAt || Date.now() - createdAt > GOOGLE_SIGNUP_TTL) throw new AppError('Google sign-in link expired. Please try again.', 400);

  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth = google.oauth2({ version: 'v2', auth: client });
  const { data: profile } = await oauth.userinfo.get();
  if (!profile.email || !profile.verified_email) throw new AppError('Google did not provide a verified email address.', 401);

  // Confirm that the consented Gmail API scope is valid without reading any
  // messages or saving mailbox data. This only returns mailbox metadata.
  const gmail = google.gmail({ version: 'v1', auth: client });
  await gmail.users.getProfile({ userId: 'me' });

  const record = await users.findByEmail(profile.email.toLowerCase());
  if (!record) {
    const signupToken = crypto.randomBytes(32).toString('hex');
    googleSignups.set(signupToken, {
      email: profile.email.toLowerCase(),
      name: String(profile.name || profile.email.split('@')[0]).trim().slice(0, 100),
      createdAt: Date.now()
    });
    return res.redirect(`/Google-Role-Selection.html?token=${encodeURIComponent(signupToken)}`);
  }
  return completeGoogleLogin(res, record);
}

function completeGoogleLogin(res, record) {
  const user = { id: record.UserId, name: record.FullName, email: record.Email, role: record.Role };
  const token = sessions.createSession(user);
  const destination = user.role === 'patron' ? '/Patron/Dashboard.html' : user.role === 'vendor' ? '/Vendor/Dashboard.html' : '/Login.html';
  const userJson = JSON.stringify(JSON.stringify(user)).replace(/</g, '\\u003c');
  res.type('html').send(`<!doctype html><title>Signing you in…</title><script>sessionStorage.setItem('hawkerhubToken', ${JSON.stringify(token)});sessionStorage.setItem('hawkerhubUser', ${userJson});location.replace(${JSON.stringify(destination)});</script>`);
}
async function completeGoogleSignup(req, res) {
  const { token, role } = req.body || {};
  if (!['patron', 'vendor'].includes(role)) throw new AppError('Choose either the patron or vendor role.', 400);
  const signup = googleSignups.get(token);
  googleSignups.delete(token);
  if (!signup || Date.now() - signup.createdAt > GOOGLE_SIGNUP_TTL) throw new AppError('Your Google sign-in setup expired. Please sign in with Google again.', 400);

  const record = await users.createGoogleUser(signup.name, signup.email, role, hash(crypto.randomBytes(32).toString('hex')));
  const user = { id: record.UserId, name: record.FullName, email: record.Email, role: record.Role };
  const destination = role === 'patron' ? '/Patron/Dashboard.html' : '/Vendor/Dashboard.html';
  res.status(201).json({ token: sessions.createSession(user), user, destination });
}
async function login(req, res) { const { email, password } = req.body; if (!email || !password) throw new AppError('Email and password are required.', 400); const record = await users.findByCredentials(email.trim(), hash(password)); if (!record) throw new AppError('Incorrect email or password.', 401); const user = { id: record.UserId, name: record.FullName, email: record.Email, role: record.Role }; res.json({ token: sessions.createSession(user), user }); }
async function register(req, res) { const { name, email, password } = req.body; if (!name || !email || !password) throw new AppError('Name, email and password are required.', 400); if (password.length < 8) throw new AppError('Password must be at least 8 characters.', 400); const user = await users.createPatron(name.trim(), email.trim(), hash(password)); res.status(201).json({ message: 'Account created. You can now log in.', userId: user.UserId }); }
function logout(req, res) { sessions.destroySession(req.token); res.json({ message: 'Logged out. You are now browsing as a guest.' }); }
function me(req, res) { res.json({ user: req.user }); }
module.exports = { login, register, logout, me, googleLogin, googleCallback, completeGoogleSignup };
