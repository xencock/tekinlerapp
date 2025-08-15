const express = require('express');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Customer = require('../models/Customer');
const BalanceTransaction = require('../models/BalanceTransaction');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   POST /api/sales
// @desc    Yeni satış oluştur
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await Sale.sequelize.transaction();
  
  try {
    const { customerId, paymentMethod, items, notes } = req.body;
    
    console.log('=== SATIŞ OLUŞTURMA ===');
    console.log('Payment Method:', paymentMethod);
    console.log('Customer ID:', customerId);
    console.log('Items count:', items.length);
    
    // Veresiye satış için müşteri kontrolü
    if (paymentMethod === 'Veresiye' && !customerId) {
      throw new Error('Veresiye satış için müşteri seçimi zorunludur');
    }
    
    // Satış oluştur
    const sale = await Sale.create({
      customerId: customerId || null,
      paymentMethod,
      notes,
      userId: req.user.id,
      totalAmount: 0, // Hesaplanacak
      taxAmount: 0,   // Hesaplanacak
      discountAmount: 0
    }, { transaction });

    let totalAmount = 0;

    // Satış kalemlerini oluştur
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      
      if (!product) {
        throw new Error(`Ürün bulunamadı: ${item.productId}`);
      }

      if (product.currentStock < item.quantity) {
        throw new Error(`Yetersiz stok: ${product.name} (Mevcut: ${product.currentStock}, İstenen: ${item.quantity})`);
      }

      // Ödeme yöntemine göre fiyat seç
      let price;
      if (paymentMethod === 'cash') {
        price = product.hasDiscount ? product.discountPrice : product.cashPrice;
        console.log(`Ürün: ${product.name}, Peşin fiyat: ${price}`);
      } else if (paymentMethod === 'credit') {
        price = product.hasDiscount ? product.discountPrice : product.creditPrice;
        console.log(`Ürün: ${product.name}, Vadeli fiyat: ${price}`);
      } else {
        // Eski sistem uyumluluğu için
        price = product.hasDiscount ? product.discountPrice : product.cashPrice;
        console.log(`Ürün: ${product.name}, Varsayılan fiyat: ${price}`);
      }
      
      console.log(`Ürün: ${product.name}, Seçilen fiyat: ${price}, Miktar: ${item.quantity}, Toplam: ${price * item.quantity}`);
      
      const itemTotal = price * item.quantity;

      totalAmount += itemTotal;

      // Satış kalemi oluştur
      await SaleItem.create({
        saleId: sale.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
        taxRate: 0, // Vergi hesaplaması kaldırıldı
        taxAmount: 0 // Vergi hesaplaması kaldırıldı
      }, { transaction });

      // Stok güncelle
      await product.update({
        currentStock: product.currentStock - item.quantity
      }, { transaction });

      // Stok hareketi kaydet
      await StockMovement.create({
        productId: product.id,
        type: 'sale',
        quantity: -item.quantity,
        stockBefore: product.currentStock + item.quantity,
        stockAfter: product.currentStock,
        referenceId: `Satış`,
        userId: req.user.id
      }, { transaction });
    }

    // Satış toplamlarını güncelle
    await sale.update({
      totalAmount,
      taxAmount: 0 // Vergi hesaplaması kaldırıldı
    }, { transaction });

    // Müşterili satışlar için bakiye güncelle (Veresiye ve Hesaba Kayıt)
    if (customerId) {
      // Müşteri bakiyesini güncelle
      const customer = await Customer.findByPk(customerId, { transaction });
      if (customer) {
        await customer.update({
          balance: customer.balance + totalAmount
        }, { transaction });

        // Bakiye işlemi kaydet
        await BalanceTransaction.create({
          customerId: customerId,
          type: 'debt',
          amount: totalAmount,
          description: `Satış`,
          category: 'Satış',
          date: new Date(),
          createdBy: req.user.id,
          notes: `Satış fatura no: ${sale.id}`
        }, { transaction });
      }
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Satış başarıyla oluşturuldu',
      sale: {
        id: sale.id,
        totalAmount,
        taxAmount: 0
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create sale error:', error);
    res.status(400).json({
      error: 'Satış oluşturulamadı',
      message: error.message
    });
  }
});

// @route   GET /api/sales/:id
// @desc    Get sale details by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'barcode', 'brand', 'category']
            }
          ]
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        error: 'Satış bulunamadı',
        message: 'Belirtilen ID ile satış bulunamadı'
      });
    }

    res.json({
      success: true,
      sale: sale
    });

  } catch (error) {
    console.error('Get sale details error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Satış detayları alınamadı'
    });
  }
});

// @route   GET /api/sales/customer/:customerId
// @desc    Get sales for a specific customer with details
// @access  Private
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const sales = await Sale.findAll({
      where: { customerId: req.params.customerId },
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'barcode']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      sales: sales,
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0)
    });
  } catch (error) {
    console.error('Get sales by customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Satışlar alınamadı',
    });
  }
});

// @route   GET /api/sales/stats/overview
// @desc    Satış istatistiklerini getir
// @access  Private
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    // Optional custom range
    const { startDate, endDate } = req.query;
    let rangeWhere;
    if (startDate && endDate && !isNaN(new Date(startDate)) && !isNaN(new Date(endDate))) {
      rangeWhere = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else {
      rangeWhere = { [Op.gte]: startOfMonth };
    }

    // Yalnızca aktif müşterilere ait borç (satış) işlemlerini baz al
    const activeCustomers = await Customer.findAll({ attributes: ['id'], where: { isActive: true }, raw: true });
    const activeCustomerIds = activeCustomers.map(c => c.id);
    const customerFilter = activeCustomerIds.length > 0 ? { customerId: { [Op.in]: activeCustomerIds } } : { customerId: -1 };

    // Bugünün satışları (BalanceTransaction üzerinden)
    const todaySales = await BalanceTransaction.sum('amount', {
      where: {
        type: 'debt',
        category: 'Satış',
        date: { [Op.gte]: startOfToday },
        ...customerFilter
      }
    });

    // Bu ayın satışları
    const thisMonthSales = await BalanceTransaction.sum('amount', {
      where: {
        type: 'debt',
        category: 'Satış',
        date: rangeWhere,
        ...customerFilter
      }
    });

    // Toplam satışlar
    const totalSales = await BalanceTransaction.sum('amount', {
      where: { type: 'debt', category: 'Satış', ...customerFilter }
    });

    // Bu ayın satış sayısı
    const thisMonthSalesCount = await BalanceTransaction.count({
      where: {
        type: 'debt',
        category: 'Satış',
        date: rangeWhere,
        ...customerFilter
      }
    });

    res.json({
      todaySales: todaySales || 0,
      thisMonthSales: thisMonthSales || 0,
      totalSales: totalSales || 0,
      thisMonthSalesCount: thisMonthSalesCount || 0
    });
    
  } catch (error) {
    console.error('Sales stats error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Satış istatistikleri alınamadı'
    });
  }
});

// @route   DELETE /api/sales/:id
// @desc    Satışı sil ve müşteri bakiyesini güncelle
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  const transaction = await Sale.sequelize.transaction();
  
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'items'
        },
        {
          model: Customer,
          as: 'customer'
        }
      ],
      transaction
    });

    if (!sale) {
      return res.status(404).json({
        error: 'Satış bulunamadı',
        message: 'Belirtilen ID ile satış bulunamadı'
      });
    }

    // Müşterili satışlar için bakiye güncelle
    if (sale.customerId) {
      const customer = await Customer.findByPk(sale.customerId, { transaction });
      if (customer) {
        // Müşteri bakiyesini geri al (satış tutarını çıkar)
        await customer.update({
          balance: customer.balance - sale.totalAmount
        }, { transaction });

        // İlgili bakiye işlemini de sil
        await BalanceTransaction.destroy({
          where: {
            customerId: sale.customerId,
            type: 'debt',
            category: 'Satış',
            notes: { [Op.like]: `%Satış fatura no: ${sale.id}%` }
          },
          transaction
        });
      }
    }

    // Satış kalemlerini sil ve stokları geri al
    console.log('=== SATIŞ SİLME İŞLEMİ BAŞLADI ===');
    console.log('Satış ID:', sale.id);
    console.log('Satış kalemleri sayısı:', sale.items.length);
    
    for (const item of sale.items) {
      console.log('Ürün ID:', item.productId, 'Miktar:', item.quantity);
      
      const product = await Product.findByPk(item.productId, { transaction });
      if (product) {
        console.log('Ürün bulundu:', product.name, 'Mevcut stok:', product.currentStock);
        
        // Eski stok miktarını kaydet
        const oldStock = product.currentStock;
        const newStock = oldStock + item.quantity;
        
        console.log('Stok güncelleniyor:', oldStock, '->', newStock);
        
        // Stok miktarını geri al
        await product.update({
          currentStock: newStock
        }, { transaction });
        
        console.log('Stok güncellendi!');

        // Stok hareketi kaydet
        await StockMovement.create({
          productId: product.id,
          type: 'sale_cancellation',
          quantity: item.quantity,
          stockBefore: oldStock,
          stockAfter: newStock,
          referenceId: `Satış İptali #${sale.id}`,
          userId: req.user.id
        }, { transaction });
        
        console.log('Stok hareketi kaydedildi');
      } else {
        console.log('ÜRÜN BULUNAMADI:', item.productId);
      }
    }
    
    console.log('=== SATIŞ SİLME İŞLEMİ TAMAMLANDI ===');

    // Satış kalemlerini sil
    await SaleItem.destroy({
      where: { saleId: sale.id },
      transaction
    });

    // Ana satış kaydını sil
    await sale.destroy({ transaction });

    await transaction.commit();

    // Stats cache'ini temizle - frontend'e bildirim gönder
    try {
      // WebSocket veya Server-Sent Events kullanarak frontend'e bildirim gönder
      // Şimdilik response header'ında bir flag ekleyelim
      res.set('X-Stats-Updated', 'true');
      res.set('X-Sale-Deleted', sale.id.toString());
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
      // Webhook hatası ana işlemi etkilemesin
    }

    res.json({
      message: 'Satış başarıyla silindi',
      customerBalance: sale.customer ? sale.customer.balance - sale.totalAmount : null,
      deletedSale: {
        id: sale.id,
        totalAmount: sale.totalAmount,
        customerId: sale.customerId,
        createdAt: sale.createdAt
      },
      statsUpdated: true
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Delete sale error:', error);
    res.status(500).json({
      error: 'Satış silinemedi',
      message: error.message
    });
  }
});

module.exports = router;
