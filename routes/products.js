const express = require('express');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ÖZEL ROUTES - Genel routes'tan önce tanımlanmalı

// @route   POST /api/products/suggest-barcode
// @desc    Kategori bazlı barkod önerisi
// @access  Private
router.post('/suggest-barcode', authenticateToken, async (req, res) => {
  console.log('🎯 Barkod öneri endpoint\'ine istek geldi:', req.body);
  try {
    const { category } = req.body;
    console.log('📋 Seçilen kategori:', category);
    
    if (!category) {
      console.log('❌ Kategori seçilmemiş');
      return res.status(400).json({
        error: 'Geçersiz istek',
        message: 'Kategori seçimi gereklidir'
      });
    }
    
    console.log('🔄 Barkod önerisi oluşturuluyor...');
    const result = await Product.getBarcodeForCategory(category);
    console.log('✅ Barkod önerisi sonucu:', result);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Barkod önerisi oluşturuldu',
        data: result
      });
    } else {
      res.status(400).json({
        error: 'Barkod oluşturma hatası',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('Barkod önerisi hatası:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Barkod önerisi oluşturulamadı'
    });
  }
});

// @route   GET /api/products
// @desc    Tüm ürünleri listele
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const season = req.query.season || '';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const lowStock = req.query.lowStock === 'true';

    // Build where clause
    const whereClause = {
      isActive: true
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) whereClause.category = category;
    if (season) whereClause.season = season;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await Product.findAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      offset: skip,
      limit: limit
    });

    // Filter low stock if requested
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter(product => product.isLowStock());
    }

    // Get total count for pagination
    const total = await Product.count({ where: whereClause });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Add calculated fields to products
    const productsWithCalculations = filteredProducts.map(product => ({
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    }));

    res.json({
      products: productsWithCalculations,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ürünler alınamadı'
    });
  }
});

// @route   GET /api/products/search/pos
// @desc    POS için ürün arama (sayfalama olmadan)
// @access  Private
router.get('/search/pos', authenticateToken, async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 50;

    // Build where clause
    const whereClause = {
      isActive: true
    };

    if (search) {
      // POS için daha esnek arama - barkod için tam eşleşme veya kısmi eşleşme
      const searchConditions = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];

      // Barkod araması için özel koşullar
      if (search.length >= 3) {
        // 3 veya daha fazla karakter için kısmi barkod araması
        searchConditions.push({ barcode: { [Op.like]: `%${search}%` } });
        
        // 12 haneli barkod için check digit hesaplayarak tam eşleşme dene
        if (search.length === 12 && /^\d{12}$/.test(search)) {
          try {
            // EAN-13 check digit hesaplama
            let sum = 0;
            for (let i = 0; i < 12; i++) {
              const digit = parseInt(search[i]);
              sum += digit * (i % 2 === 0 ? 1 : 3);
            }
            const checkDigit = (10 - (sum % 10)) % 10;
            const completedBarcode = search + checkDigit.toString();
            searchConditions.push({ barcode: completedBarcode });
          } catch (error) {
            // Check digit hesaplama hatası durumunda devam et
          }
        }
      } else if (search.length > 0) {
        // Tam barkod eşleşmesi için
        searchConditions.push({ barcode: search });
      }

      whereClause[Op.or] = searchConditions;
    }

    // Get products without pagination for POS
    const products = await Product.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: limit
    });

    // Sort results to prioritize exact barcode matches
    const sortedProducts = products.sort((a, b) => {
      const aExactBarcode = a.barcode === search;
      const bExactBarcode = b.barcode === search;
      
      if (aExactBarcode && !bExactBarcode) return -1;
      if (!aExactBarcode && bExactBarcode) return 1;
      
      // Barkod ile başlayan sonuçları önceliklendir
      const aStartsWithBarcode = a.barcode && a.barcode.startsWith(search);
      const bStartsWithBarcode = b.barcode && b.barcode.startsWith(search);
      
      if (aStartsWithBarcode && !bStartsWithBarcode) return -1;
      if (!aStartsWithBarcode && bStartsWithBarcode) return 1;
      
      return a.name.localeCompare(b.name);
    });

    // Add calculated fields to products
    const productsWithCalculations = sortedProducts.map(product => ({
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    }));

    res.json({
      products: productsWithCalculations,
      total: productsWithCalculations.length
    });

  } catch (error) {
    console.error('POS product search error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ürün arama hatası'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Belirli bir ürünü getir
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Ürün bulunamadı',
        message: 'Belirtilen ID ile ürün bulunamadı'
      });
    }

    // Add calculated fields
    const productWithCalculations = {
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    };

    res.json({ product: productWithCalculations });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ürün bilgileri alınamadı'
    });
  }
});

// @route   POST /api/products
// @desc    Yeni ürün oluştur
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name, barcode, category, subCategory, brand, material,
      color, size, season, costPrice, retailPrice,
      currentStock
    } = req.body;

// Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await Product.findOne({ where: { barcode } });
      if (existingBarcode) {
        return res.status(400).json({
          error: 'Barkod hatası',
          message: 'Bu barkod zaten kullanılıyor'
        });
      }
    }

    // Create new product
    const product = await Product.create({
      name, barcode, category, subCategory, brand, material,
      color, size, season, costPrice, retailPrice,
      currentStock
    });

    // Add calculated fields
    const productWithCalculations = {
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    };

    res.status(201).json({
      message: 'Ürün başarıyla oluşturuldu',
      product: productWithCalculations
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validasyon hatası',
        message: error.errors.map(err => err.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Benzersizlik hatası',
        message: 'Barkod zaten kullanılıyor'
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ürün oluşturulamadı'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Ürün bilgilerini güncelle
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Ürün bulunamadı',
        message: 'Belirtilen ID ile ürün bulunamadı'
      });
    }

    const {
      name, barcode, category, subCategory, brand, material,
      color, size, season, costPrice, retailPrice,
      currentStock
    } = req.body;

// Check if barcode is taken by another product
    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ 
        where: { 
          barcode,
          id: { [Op.ne]: req.params.id }
        }
      });
      if (existingBarcode) {
        return res.status(400).json({
          error: 'Barkod hatası',
          message: 'Bu barkod zaten kullanılıyor'
        });
      }
    }

    // Update product
    await product.update({
      name, barcode, category, subCategory, brand, material,
      color, size, season, costPrice, retailPrice,
      currentStock
    });

    // Add calculated fields
    const productWithCalculations = {
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    };

    res.json({
      message: 'Ürün başarıyla güncellendi',
      product: productWithCalculations
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validasyon hatası',
        message: error.errors.map(err => err.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ürün güncellenemedi'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Ürünü sil (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Ürün bulunamadı',
        message: 'Belirtilen ID ile ürün bulunamadı'
      });
    }

    // Soft delete - set isActive to false
    await product.update({ isActive: false });

    res.json({
      message: 'Ürün başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ürün silinemedi'
    });
  }
});

// @route   PATCH /api/products/:id/stock
// @desc    Ürün stok güncelle
// @access  Private
router.patch('/:id/stock', authenticateToken, async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Ürün bulunamadı',
        message: 'Belirtilen ID ile ürün bulunamadı'
      });
    }

    let newStock = product.currentStock;
    
    if (operation === 'add') {
      newStock += parseInt(quantity);
    } else if (operation === 'subtract') {
      newStock -= parseInt(quantity);
      if (newStock < 0) {
        return res.status(400).json({
          error: 'Stok hatası',
          message: 'Stok miktarı sıfırdan küçük olamaz'
        });
      }
    } else {
      return res.status(400).json({
        error: 'İşlem hatası',
        message: 'Geçersiz işlem türü'
      });
    }

    await product.update({ currentStock: newStock });

    // Add calculated fields
    const productWithCalculations = {
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    };

    res.json({
      message: 'Stok başarıyla güncellendi',
      product: productWithCalculations
    });

  } catch (error) {
    console.error('Update stock error:', error);
    
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Stok güncellenemedi'
    });
  }
});

// @route   GET /api/products/filters/options
// @desc    Filtreleme seçeneklerini getir
// @access  Private
router.get('/filters/options', authenticateToken, async (req, res) => {
  try {
    const [categories, seasons, brands] = await Promise.all([
      Product.findAll({
        attributes: ['category'],
        where: { isActive: true },
        group: ['category'],
        order: [['category', 'ASC']]
      }),
      Product.findAll({
        attributes: ['season'],
        where: { 
          isActive: true,
          season: { [Op.ne]: null }
        },
        group: ['season'],
        order: [['season', 'ASC']]
      }),
      Product.findAll({
        attributes: ['brand'],
        where: { 
          isActive: true,
          brand: { [Op.ne]: null }
        },
        group: ['brand'],
        order: [['brand', 'ASC']]
      })
    ]);

    res.json({
      categories: categories.map(item => item.category),
      colors: [], // Artık kullanılmıyor
      sizes: [], // Artık kullanılmıyor
      seasons: seasons.map(item => item.season),
      brands: brands.map(item => item.brand)
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Filtre seçenekleri alınamadı'
    });
  }
});

// @route   GET /api/products/low-stock
// @desc    Düşük stoklu ürünleri listele
// @access  Private
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const products = await Product.getLowStockProducts();
    
    const productsWithCalculations = products.map(product => ({
      ...product.toJSON(),
      isLowStock: product.isLowStock(),
      profitMargin: product.profitMargin(),
      stockValue: product.stockValue()
    }));

    res.json({
      products: productsWithCalculations,
      count: productsWithCalculations.length
    });

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Düşük stoklu ürünler alınamadı'
    });
  }
});

module.exports = router;