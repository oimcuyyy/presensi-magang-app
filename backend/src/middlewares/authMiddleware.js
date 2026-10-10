const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    // In development, use a dev-only secret with a warning
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠ Using development-only JWT secret. Set JWT_SECRET in .env for production.');
      return 'dev_only_secret_DO_NOT_USE_IN_PRODUCTION';
    }
    process.exit(1);
  }
  return secret;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });

    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak akses untuk resource ini.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole, getJwtSecret };
