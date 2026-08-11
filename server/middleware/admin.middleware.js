const jwt = require('jsonwebtoken');
const { isBlocked } = require('../utils/blockedUsers');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded.user;

    if (req.user && isBlocked(req.user.id)) {
      return res.status(401).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    const prisma = req.app.locals.prisma;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { user_type: true, is_active: true }
    });

    if (!user || user.user_type !== 'ADMIN' || !user.is_active) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
