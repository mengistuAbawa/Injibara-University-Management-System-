const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [[user]] = await db.query(
      'SELECT user_id, role, is_active FROM users WHERE user_id = ? LIMIT 1',
      [decoded.id]
    );
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Account is inactive or no longer available' });
    }
    const tokenRole = String(decoded.role || '').trim().toLowerCase();
    const currentRole = String(user.role || '').trim().toLowerCase();
    if (tokenRole !== currentRole) {
      return res.status(401).json({ message: 'Session role is no longer valid; please log in again' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};