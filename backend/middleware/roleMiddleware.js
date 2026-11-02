exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRole = String(req.user.role || '').trim().toLowerCase();
  req.user.role = userRole;

  if (!roles.map((role) => String(role).toLowerCase()).includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }

  next();
};