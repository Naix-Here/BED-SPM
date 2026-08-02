// controllers/authController.js — Authentication endpoints.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const UserModel = require('../models/userModel');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'shcms_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

function issueLoginToken(user) {
  return jwt.sign({ id: user.UserId, role: user.Role, email: user.Email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function publicUser(user) {
  return { userId: user.UserId, email: user.Email, fullName: user.FullName, role: user.Role };
}

function frontendUrl(path) {
  return new URL(path, process.env.FRONTEND_URL || 'http://localhost:3000').toString();
}

async function sendPasswordResetEmail(email, resetUrl) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV === 'production') throw new Error('Password-reset email is not configured.');
    console.info(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Reset your SG Hawker password',
    text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl}`,
  });
}

/**
 * POST /api/auth/register
 * Body: { email, password, fullName, role }
 */
async function register(req, res, next) {
  try {
    const { email, password, fullName, role } = req.body;

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await UserModel.create({
      email,
      passwordHash,
      fullName,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in.',
      data: {
        userId: created.UserId,
        email: created.Email,
        fullName: created.FullName,
        role: created.Role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = issueLoginToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function beginGoogleLogin(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return res.status(503).send('Google sign-in is not configured.');
  }
  const state = jwt.sign({ purpose: 'google-oauth', nonce: crypto.randomBytes(16).toString('hex') }, JWT_SECRET, { expiresIn: '10m' });
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: process.env.GOOGLE_REDIRECT_URI, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  return res.redirect(url.toString());
}

async function googleCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(frontendUrl(`/login.html?error=${encodeURIComponent('Google sign-in was cancelled.')}`));
    const oauthState = jwt.verify(state, JWT_SECRET);
    if (oauthState.purpose !== 'google-oauth') throw new Error('Invalid Google sign-in state.');
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: process.env.GOOGLE_REDIRECT_URI, grant_type: 'authorization_code' }) });
    if (!tokenResponse.ok) throw new Error('Google could not exchange the authorization code.');
    const tokens = await tokenResponse.json();
    const profileResponse = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) throw new Error('Google profile could not be retrieved.');
    const profile = await profileResponse.json();
    if (!profile.sub || !profile.email || !profile.email_verified) throw new Error('A verified Google email address is required.');
    let user = await UserModel.findByGoogleSubject(profile.sub);
    if (!user) {
      user = await UserModel.findByEmail(profile.email.toLowerCase());
      if (user) await UserModel.linkGoogleAccount(user.UserId, profile.sub);
    }
    if (user) {
      const loginToken = issueLoginToken(user);
      return res.redirect(frontendUrl(`/auth-callback.html?token=${encodeURIComponent(loginToken)}`));
    }
    const registrationToken = jwt.sign({ purpose: 'google-registration', sub: profile.sub, email: profile.email.toLowerCase(), name: profile.name || profile.email.split('@')[0] }, JWT_SECRET, { expiresIn: '10m' });
    return res.redirect(frontendUrl(`/role-select.html?registration=${encodeURIComponent(registrationToken)}`));
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.redirect(frontendUrl('/login.html?error=Google+sign-in+expired.+Please+try+again.'));
    next(err);
  }
}

async function completeGoogleRegistration(req, res, next) {
  try {
    const { registration, role } = req.body;
    const details = jwt.verify(registration, JWT_SECRET);
    if (details.purpose !== 'google-registration') return res.status(400).json({ success: false, message: 'Invalid registration request.' });
    if (!['Customer', 'Vendor'].includes(role)) return res.status(400).json({ success: false, message: 'Choose Customer or Vendor.' });
    if (await UserModel.findByGoogleSubject(details.sub) || await UserModel.findByEmail(details.email)) return res.status(409).json({ success: false, message: 'This Google account has already been registered. Please sign in again.' });
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('base64url'), SALT_ROUNDS);
    const user = await UserModel.createGoogleUser({ email: details.email, fullName: details.name.substring(0, 100), role, googleSubject: details.sub, passwordHash });
    return res.status(201).json({ success: true, data: { token: issueLoginToken(user), user: publicUser(user) } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(400).json({ success: false, message: 'Your Google sign-in session expired. Please try again.' });
    next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const email = req.body.email.toLowerCase();
    const user = await UserModel.findByEmail(email);
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await UserModel.savePasswordResetToken(user.UserId, tokenHash, new Date(Date.now() + 30 * 60 * 1000));
      await sendPasswordResetEmail(email, frontendUrl(`/reset-password.html?token=${encodeURIComponent(rawToken)}`));
    }
    return res.json({ success: true, message: 'If that email is registered, a password-reset link has been sent.' });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findByPasswordResetToken(tokenHash);
    if (!user) return res.status(400).json({ success: false, message: 'This password-reset link is invalid or has expired.' });
    await UserModel.resetPassword(user.UserId, await bcrypt.hash(password, SALT_ROUNDS));
    return res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
  } catch (err) { next(err); }
}

/**
 * GET /api/auth/me  (auth required)
 */
async function me(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/password  (auth required)
 * Body: { oldPassword, newPassword }
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await UserModel.findByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const match = await bcrypt.compare(oldPassword, user.PasswordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword(req.user.id, newHash);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, changePassword, beginGoogleLogin, googleCallback, completeGoogleRegistration, requestPasswordReset, resetPassword };
