const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rawUserId = decoded.id !== undefined ? decoded.id : (decoded.userId !== undefined ? decoded.userId : decoded.sub);
    const userId = rawUserId === undefined || rawUserId === null ? null : Number(rawUserId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ message: 'Not authorized, token invalid.' });
    }

    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) {
      return res.status(401).json({
        message: 'Not authorized, user not found. Please sign in again.'
      });
    }

    req.user = { id: String(user.id), email: user.email, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid.' });
  }
});

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

module.exports = { protect, adminOnly, authorizeRoles };
