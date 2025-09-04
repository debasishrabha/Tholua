const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // <--- add this

// Signup
router.post('/signup', authController.signup);

// Login
router.post('/login', authController.login);

// Forgot Password
router.post('/forgot_password', authController.forgotPassword);

// Reset Password
router.post('/reset_password/:token', authController.resetPassword);

// ✅ Current logged-in user
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
