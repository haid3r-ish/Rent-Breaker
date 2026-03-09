const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — verifies the JWT in the Authorization header.
 * Attaches req.user to the request on success.
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Bearer header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info (excluding password) to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'This user account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * Restrict route access to Admin role only.
 * Must be used AFTER protect middleware.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin role required.',
  });
};

/**
 * Restrict to Admin or Staff roles.
 * Must be used AFTER protect middleware.
 */
const isStaffOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Staff')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Insufficient permissions.',
  });
};

module.exports = { protect, isAdmin, isStaffOrAdmin };
