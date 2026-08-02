// routes/authRoutes.js — Auth endpoints.
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require('../middleware/validators');

router.post('/register', validateRegister, authController.register);

router.post('/login', validateLogin, authController.login);

router.get('/me', verifyToken, authController.me);

router.put('/password', verifyToken, validateChangePassword, authController.changePassword);

module.exports = router;
