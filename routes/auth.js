const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  validateUserCreation, 
  validateLogin, 
  validatePinChange 
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Kullanıcı kaydı (Sadece admin tarafından)
// @access  Private
router.post('/register', authenticateToken, requireAdmin, validateUserCreation, async (req, res) => {
  try {
    const { username, pin, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      return res.status(400).json({
        error: 'Kayıt hatası',
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      pin,
      fullName,
      phone
    });

    // Return user data (without PIN)
    const userResponse = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Kayıt hatası',
        message: 'Kullanıcı adı zaten kullanılıyor'
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı oluşturulamadı'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, pin } = req.body;

    // Find user by credentials
    const user = await User.findByCredentials(username, pin);

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without PIN)
    const userResponse = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Giriş başarılı',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    
    res.status(401).json({
      error: 'Giriş hatası',
      message: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Kullanıcı çıkışı
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more complex system, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Çıkış yapılamadı'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Mevcut kullanıcı bilgilerini getir
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResponse = {
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName,
      phone: req.user.phone,
      isActive: req.user.isActive,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt
    };

    res.json({
      user: userResponse
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı bilgileri alınamadı'
    });
  }
});

// @route   POST /api/auth/change-pin
// @desc    PIN değiştirme
// @access  Private
router.post('/change-pin', authenticateToken, validatePinChange, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    // Get user with PIN field
    const userWithPin = await User.findByPk(req.user.id);
    
    // Verify current PIN
    const isMatch = await userWithPin.comparePin(currentPin);
    
    if (!isMatch) {
      return res.status(400).json({
        error: 'PIN hatası',
        message: 'Mevcut PIN yanlış'
      });
    }

    // Update PIN
    await userWithPin.update({ pin: newPin });

    res.json({
      message: 'PIN başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'PIN değiştirilemedi'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Token yenileme
// @access  Private
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const newToken = generateToken(req.user.id);

    res.json({
      message: 'Token yenilendi',
      token: newToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Token yenilenemedi'
    });
  }
});

module.exports = router; 