// controllers/authController.js — Authentication endpoints.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'shcms_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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

    const token = jwt.sign(
      { id: user.UserId, role: user.Role, email: user.Email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          userId: user.UserId,
          email: user.Email,
          fullName: user.FullName,
          role: user.Role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
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

module.exports = { register, login, me, changePassword };
