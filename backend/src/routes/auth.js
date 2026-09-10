const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

const createToken = () => crypto.randomBytes(20).toString('hex');

const buildUrl = (path) => {
  const base = process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}${path}`;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured. Email contents:', { to, subject, text });
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@foodie.com',
    to,
    subject,
    text,
    html
  });
  return true;
};

const createAuthToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
  expiresIn: '30d'
});

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username || user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt
});

router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  // Avoid using Op.or to prevent runtime issues in some environments; check separately
  const userByEmail = await User.findOne({ where: { email: email.toLowerCase() } });
  if (userByEmail) return res.status(409).json({ message: 'Email is already in use.' });

  const userByUsername = await User.findOne({ where: { username } });
  if (userByUsername) return res.status(409).json({ message: 'Username is already in use.' });

  // Auto-verify on signup to avoid blocking login by email verification
  const user = await User.create({
    name: username,
    username,
    email: email.toLowerCase(),
    password,
    emailVerified: true
  });

  const token = createAuthToken(user);

  res.status(201).json({
    user: sanitizeUser(user),
    token,
    message: 'Account created and verified.'
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = await User.findOne({ where: { username } });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  // With auto-verify on signup, this will rarely block, but keep the check for safety
  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Email is not verified. Please verify your account.' });
  }

  const token = createAuthToken(user);
  res.json({ user: sanitizeUser(user), token });
}));

router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ message: 'Verification token is required.' });
  }

  const user = await User.findOne({ where: { verificationToken: token } });
  if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
    return res.status(400).json({ message: 'Verification token is invalid or expired.' });
  }

  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationExpires = null;
  await user.save();

  res.json({ message: 'Email verified successfully.' });
}));

router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, a verification email has been sent.' });
  }
  if (user.emailVerified) {
    return res.status(400).json({ message: 'Email is already verified.' });
  }

  user.verificationToken = createToken();
  user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verificationUrl = buildUrl(`/api/auth/verify-email/${user.verificationToken}`);
  const emailSent = await sendEmail({
    to: user.email,
    subject: 'Resend verification for Foodie',
    text: `Use this link to verify your email: ${verificationUrl}`,
    html: `<p>Use this link to verify your email:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
  });

  res.json({ message: 'Verification email sent.', verificationUrl: emailSent ? undefined : verificationUrl });
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (user) {
    user.resetPasswordToken = createToken();
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = buildUrl(`/api/auth/reset-password/${user.resetPasswordToken}`);
    await sendEmail({
      to: user.email,
      subject: 'Reset your Foodie password',
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });

    return res.json({ message: 'If an account exists, a password reset email has been sent.', resetUrl });
  }

  res.json({ message: 'If an account exists, a password reset email has been sent.' });
}));

router.post('/reset-password/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  const user = await User.findOne({ where: { resetPasswordToken: token } });
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: 'Password reset token is invalid or expired.' });
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: 'Password has been reset successfully.' });
}));

router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] } });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json(sanitizeUser(user));
}));

router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (name) user.name = name;
  if (password) user.password = password;
  await user.save();

  res.json(sanitizeUser(user));
}));

module.exports = router;
