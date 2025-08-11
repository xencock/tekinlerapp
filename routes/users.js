const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserCreation, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Tüm kullanıcıları listele
// @access  Private
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build where clause
    const whereClause = search ? {
      [Op.or]: [
        { username: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get users with pagination
    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['pin'] },
      order: [[sortBy, sortOrder === 1 ? 'ASC' : 'DESC']],
      offset,
      limit
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcılar alınamadı'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Belirli bir kullanıcıyı getir
// @access  Private
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['pin'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Belirtilen ID ile kullanıcı bulunamadı'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    
    // Sequelize kullanıldığı için ObjectId kontrolü gereksiz

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı bilgileri alınamadı'
    });
  }
});

// @route   POST /api/users
// @desc    Yeni kullanıcı oluştur
// @access  Private
router.post('/', authenticateToken, requireAdmin, validateUserCreation, async (req, res) => {
  try {
    const { username, pin, fullName, phone } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        error: 'Kullanıcı zaten var',
        message: 'Bu kullanıcı adı zaten kullanılıyor.'
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      pin,
      fullName,
      phone
    });

    // Don't send pin back
    const userResponse = newUser.toJSON();
    delete userResponse.pin;

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı oluşturulamadı'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Kullanıcı bilgilerini güncelle
// @access  Private
router.put('/:id', authenticateToken, requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { username, fullName, phone, pin } = req.body;

    // Check if user exists
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Belirtilen ID ile kullanıcı bulunamadı'
      });
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: req.params.id }
        }
      });
      if (existingUsername) {
        return res.status(400).json({
          error: 'Güncelleme hatası',
          message: 'Bu kullanıcı adı zaten kullanılıyor'
        });
      }
    }

    // Update user fields
    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (pin) user.pin = pin; // The hook will hash it

    await user.save();
    
    const userResponse = user.toJSON();
    delete userResponse.pin;

    res.json({
      message: 'Kullanıcı başarıyla güncellendi',
      user: userResponse
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    // Sequelize unique constraint hataları için generic yanıt

    // Sequelize kullanıldığı için ObjectId kontrolü gereksiz

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı güncellenemedi'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Kullanıcıyı sil (soft delete - isActive: false)
// @access  Private
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Belirtilen ID ile kullanıcı bulunamadı'
      });
    }

    // Soft delete - set isActive to false
    await user.update({ isActive: false });

    res.json({
      message: 'Kullanıcı başarıyla deaktif edildi'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    
    // Sequelize kullanıldığı için ObjectId kontrolü gereksiz

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı silinemedi'
    });
  }
});

// @route   PATCH /api/users/:id/activate
// @desc    Kullanıcıyı aktif et
// @access  Private
router.patch('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Belirtilen ID ile kullanıcı bulunamadı'
      });
    }

    await user.update({ isActive: true });

    res.json({
      message: 'Kullanıcı başarıyla aktif edildi'
    });

  } catch (error) {
    console.error('Activate user error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Geçersiz ID',
        message: 'Geçersiz kullanıcı ID formatı'
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı aktif edilemedi'
    });
  }
});

module.exports = router;
