const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({message: 'No token provided'});
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({message: 'Token error'});
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({message: 'Token malformatted'});
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({message: 'Token invalid'});
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({message: 'Not authenticated'});
    if (roles.length && !roles.includes(req.user.role_name)) {
      return res.status(403).json({message: 'Forbidden: insufficient rights'});
    }
    next();
  };
};

module.exports = { authenticate, authorize };
