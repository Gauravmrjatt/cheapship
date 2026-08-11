const jwt = require('jsonwebtoken');
const { isBlocked } = require('../utils/blockedUsers');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded.user;

    // Reject blocked users even with a valid, unexpired token
    if (req.user && isBlocked(req.user.id)) {
      return res.status(401).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
