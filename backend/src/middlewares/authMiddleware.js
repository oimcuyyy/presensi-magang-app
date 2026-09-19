const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  jwt.verify(token, process.env.JWT_SECRET || 'rahasia_presensi_magang_123', (err, user) => {
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

module.exports = { authenticateToken, authorizeRole };
