/**
 * Allows only instructors with is_hod = TRUE.
 * Assumes `req.user.is_hod` is set by the JWT payload.
 */
exports.requireHod = (req, res, next) => {
  if (req.user?.role !== 'instructor' || !req.user?.is_hod) {
    return res.status(403).json({ message: 'HOD access only' });
  }
  next();
};