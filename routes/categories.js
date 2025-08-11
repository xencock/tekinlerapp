const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// @route   GET /api/categories
// @desc    Tüm kategorileri getir
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.getAllCategories();
    
    res.json({
      categories,
      count: categories.length
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kategoriler alınamadı'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Tek kategori bilgisi getir
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'Kategori bulunamadı',
        message: 'Belirtilen ID ile kategori bulunamadı'
      });
    }

    res.json({ category });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kategori bilgileri alınamadı'
    });
  }
});

// @route   POST /api/categories
// @desc    Yeni kategori oluştur
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, sortOrder, color } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      where: { name: name } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        error: 'Kategori hatası',
        message: 'Bu kategori adı zaten kullanılıyor'
      });
    }

    const category = await Category.create({
      name,
      description,
      sortOrder: sortOrder || 0,
      color: color || '#6B7280'
    });

    res.status(201).json({
      message: 'Kategori başarıyla oluşturuldu',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Doğrulama hatası',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Benzersizlik hatası',
        message: 'Kategori adı zaten kullanılıyor'
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kategori oluşturulamadı'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Kategori bilgilerini güncelle
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'Kategori bulunamadı',
        message: 'Belirtilen ID ile kategori bulunamadı'
      });
    }

    const { name, description, sortOrder, isActive, color } = req.body;

    // Check if category name is taken by another category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        where: { 
          name: name,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          error: 'Kategori hatası',
          message: 'Bu kategori adı zaten kullanılıyor'
        });
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
      isActive: isActive !== undefined ? isActive : category.isActive,
      color: color || category.color
    });

    res.json({
      message: 'Kategori başarıyla güncellendi',
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Doğrulama hatası',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Benzersizlik hatası',
        message: 'Kategori adı zaten kullanılıyor'
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kategori güncellenemedi'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Kategori sil
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'Kategori bulunamadı',
        message: 'Belirtilen ID ile kategori bulunamadı'
      });
    }



    // Instead of hard delete, mark as inactive
    await category.update({ isActive: false });

    res.json({
      message: 'Kategori başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kategori silinemedi'
    });
  }
});

module.exports = router;