const jwt = require('jsonwebtoken');

/**
 * Protects a route so only a logged-in admin (valid JWT cookie) can use it.
 */
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'You must be logged in as admin to do that.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

module.exports = { requireAdmin };
