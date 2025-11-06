const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check if user is the event organizer or has admin privileges
const checkEventOwnership = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.params.eventId;

    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    const result = await pool.query(
      'SELECT organizer_id FROM events WHERE id = $1',
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.'
      });
    }

    if (result.rows[0].organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not the organizer of this event.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while checking event ownership.'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  checkEventOwnership
};