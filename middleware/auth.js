const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET || 'tekinler_default_secret_key_2025';
  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Erişim reddedildi',
        message: 'Token bulunamadı'
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'tekinler_default_secret_key_2025';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Erişim reddedildi',
        message: 'Geçersiz token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Erişim reddedildi',
        message: 'Hesabınız deaktif'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Erişim reddedildi',
        message: 'Geçersiz token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Erişim reddedildi',
        message: 'Token süresi dolmuş'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Token doğrulama hatası'
    });
  }
};

// Require admin middleware
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Erişim reddedildi',
        message: 'Kimlik doğrulaması gerekli'
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Yetkisiz işlem',
        message: 'Bu işlem için yönetici yetkisi gerekli'
      });
    }

    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    return res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Yetki kontrolü sırasında hata oluştu'
    });
  }
};

// Optional authentication middleware (doesn't require token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  optionalAuth,
  requireAdmin
}; 