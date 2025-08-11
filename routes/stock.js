const express = require('express');
const { sequelize, Sequelize } = require('../config/database');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/stock/movements
// @desc    Yeni stok hareketi oluştur (stok girişi, düzeltme vb.)
// @access  Private
router.post('/movements', authenticateToken, async (req, res) => {
  const { productId, type, quantity, notes, referenceId } = req.body;

  if (!productId || !type || !quantity) {
    return res.status(400).json({ error: 'Gerekli alanlar eksik: productId, type, quantity' });
  }

  const t = await sequelize.transaction();

  try {
    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });

    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    const stockBefore = product.currentStock;
    const newStock = stockBefore + parseInt(quantity, 10);

    if (newStock < 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Stok miktarı sıfırdan küçük olamaz' });
    }

    // Stok hareketini kaydet
    await StockMovement.create({
      productId,
      userId: req.user.id,
      type,
      quantity: parseInt(quantity, 10),
      stockBefore,
      stockAfter: newStock,
      notes,
      referenceId
    }, { transaction: t });

    // Ürün stoğunu güncelle
    product.currentStock = newStock;
    await product.save({ transaction: t });

    await t.commit();

    res.status(201).json({
      message: 'Stok hareketi başarıyla kaydedildi',
      product
    });

  } catch (error) {
    await t.rollback();
    console.error('Stok hareketi hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası', message: 'Stok hareketi oluşturulamadı' });
  }
});

// @route   GET /api/stock/movements/:productId
// @desc    Belirli bir ürünün stok hareketlerini listele
// @access  Private
router.get('/movements/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const movements = await StockMovement.findAndCountAll({
      where: { productId },
      include: [{ model: User, as: 'user', attributes: ['username'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      data: movements.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(movements.count / limit),
        totalItems: movements.count
      }
    });

  } catch (error) {
    console.error('Stok hareketleri alınamadı:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;