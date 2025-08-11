const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const BalanceTransaction = require('../models/BalanceTransaction');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { Op } = require('sequelize');

// Associations are now defined in the model files

// Tüm bakiye işlemlerini getir
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const whereClause = {};
    if (customerId) whereClause.customerId = customerId;
    if (type) whereClause.type = type;
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: transactions } = await BalanceTransaction.findAndCountAll({
      where: whereClause,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'phone']
      }, {
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'fullName', 'username']
      }],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Bakiye işlemleri getirilemedi:', error);
    res.status(500).json({ error: 'Bakiye işlemleri getirilemedi' });
  }
});

// Müşteri bazında bakiye işlemlerini getir
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: transactions } = await BalanceTransaction.findAndCountAll({
      where: { customerId },
      include: [{
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'fullName', 'username']
      }],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Müşteri bilgilerini de getir
    const customer = await Customer.findByPk(customerId);
    
    res.json({
      customer,
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Müşteri bakiye işlemleri getirilemedi:', error);
    res.status(500).json({ error: 'Müşteri bakiye işlemleri getirilemedi' });
  }
});

// Yeni bakiye işlemi ekle
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customerId,
      type,
      amount,
      description,
      category,
      date,
      notes
    } = req.body;
    
    // Müşteriyi kontrol et
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }
    
    // Tarih doğrulaması
    let transactionDate = new Date();
    if (date) {
      // Eğer sadece tarih (YYYY-MM-DD) formatında geliyorsa, mevcut saati koru
      if (date.length === 10 && date.includes('-')) {
        // YYYY-MM-DD formatı - mevcut saat bilgisini koru
        const [year, month, day] = date.split('-');
        transactionDate = new Date();
        transactionDate.setFullYear(parseInt(year));
        transactionDate.setMonth(parseInt(month) - 1); // ay 0-indexed
        transactionDate.setDate(parseInt(day));
      } else {
        // Tam tarih-saat formatı
        const inputDate = new Date(date);
        if (isNaN(inputDate.getTime())) {
          return res.status(400).json({ error: 'Geçersiz tarih formatı' });
        }
        transactionDate = inputDate;
      }
    }

    // Bakiye işlemini oluştur
    const transaction = await BalanceTransaction.create({
      customerId,
      type,
      amount: parseFloat(amount),
      description,
      category,
      date: transactionDate,
      createdBy: req.user.id,
      notes
    });
    
    // Müşteri bakiyesini güncelle
    // payment (ödeme) = borç azalır (-), debt (borç) = borç artar (+)
    const balanceChange = type === 'payment' ? -parseFloat(amount) : parseFloat(amount);
    await customer.update({
      balance: parseFloat(customer.balance || 0) + balanceChange
    });
    
    res.status(201).json({
      message: 'Bakiye işlemi başarıyla eklendi',
      transaction,
      newBalance: customer.balance + balanceChange
    });
  } catch (error) {
    console.error('Bakiye işlemi eklenemedi:', error);
    res.status(500).json({ error: 'Bakiye işlemi eklenemedi' });
  }
});

// Bakiye işlemini güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await BalanceTransaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Bakiye işlemi bulunamadı' });
    }
    
    // Eski tutarı geri al
    const oldBalanceChange = transaction.type === 'payment' ? transaction.amount : -transaction.amount;
    
    // Yeni tutarı uygula
    const newBalanceChange = req.body.type === 'payment' ? -parseFloat(req.body.amount) : parseFloat(req.body.amount);
    
    // Güncelleme verilerini hazırla
    const updateData = {
      type: req.body.type,
      amount: parseFloat(req.body.amount),
      description: req.body.description,
      category: req.body.category || transaction.category,
      notes: req.body.notes || transaction.notes
    };
    
    // Tarih güncelleme kontrolü
    if (req.body.date) {

      
      // Eğer sadece tarih (YYYY-MM-DD) formatında geliyorsa, mevcut saat bilgisini koru
      if (req.body.date.length === 10 && req.body.date.includes('-')) {
        // YYYY-MM-DD formatı - eski işlemin saat bilgisini koru
        const [year, month, day] = req.body.date.split('-');
        const newDate = new Date(transaction.date); // Eski işlemin tarihi
        newDate.setFullYear(parseInt(year));
        newDate.setMonth(parseInt(month) - 1); // ay 0-indexed
        newDate.setDate(parseInt(day));
        updateData.date = newDate;
      } else {
        // Tam tarih-saat formatı
        const inputDate = new Date(req.body.date);
        
        // Geçerli tarih kontrolü
        if (isNaN(inputDate.getTime())) {
          return res.status(400).json({ error: 'Geçersiz tarih formatı' });
        }
        
        updateData.date = inputDate;
      }

    }
    
    // İşlemi güncelle
    await transaction.update(updateData);
    
    // Müşteri bakiyesini güncelle
    const customer = await Customer.findByPk(transaction.customerId);
    const balanceChange = oldBalanceChange + newBalanceChange;
    await customer.update({
      balance: parseFloat(customer.balance || 0) + balanceChange
    });
    
    res.json({
      message: 'Bakiye işlemi güncellendi',
      transaction,
      newBalance: customer.balance + balanceChange
    });
  } catch (error) {
    console.error('Bakiye işlemi güncellenemedi:', error);
    res.status(500).json({ error: 'Bakiye işlemi güncellenemedi' });
  }
});

// Bakiye işlemini sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await BalanceTransaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Bakiye işlemi bulunamadı' });
    }
    
    // Müşteri bakiyesini geri al
    const balanceChange = transaction.type === 'payment' ? transaction.amount : -transaction.amount;
    const customer = await Customer.findByPk(transaction.customerId);
    await customer.update({
      balance: parseFloat(customer.balance || 0) + balanceChange
    });
    
    // İşlemi sil
    await transaction.destroy();
    
    res.json({
      message: 'Bakiye işlemi silindi',
      newBalance: customer.balance + balanceChange
    });
  } catch (error) {
    console.error('Bakiye işlemi silinemedi:', error);
    res.status(500).json({ error: 'Bakiye işlemi silinemedi' });
  }
});

// Bakiye istatistikleri
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    
    // Eğer tarih aralığı belirtilmemişse, bu ayın verilerini getir
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Bu ayın başlangıcını hesapla
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      whereClause.date = {
        [Op.gte]: startOfMonth
      };
    }
    
    // Tüm zamanların verilerini de hesapla
    const [
      totalPayments, 
      totalDebts, 
      totalTransactions,
      allTimePayments,
      allTimeDebts,
      allTimeTransactions
    ] = await Promise.all([
      BalanceTransaction.sum('amount', { where: { ...whereClause, type: 'payment' } }),
      BalanceTransaction.sum('amount', { where: { ...whereClause, type: 'debt' } }),
      BalanceTransaction.count({ where: whereClause }),
      BalanceTransaction.sum('amount', { where: { type: 'payment' } }),
      BalanceTransaction.sum('amount', { where: { type: 'debt' } }),
      BalanceTransaction.count()
    ]);
    
    const netBalance = (totalDebts || 0) - (totalPayments || 0);
    const allTimeNetBalance = (allTimeDebts || 0) - (allTimePayments || 0);
    
    res.json({
      // Bu ayın verileri (veya belirtilen tarih aralığı)
      totalPayments: totalPayments || 0,
      totalDebts: totalDebts || 0,
      netBalance,
      totalTransactions,
      // Tüm zamanların verileri
      allTimePayments: allTimePayments || 0,
      allTimeDebts: allTimeDebts || 0,
      allTimeNetBalance,
      allTimeTransactions
    });
  } catch (error) {
    console.error('Bakiye istatistikleri getirilemedi:', error);
    res.status(500).json({ error: 'Bakiye istatistikleri getirilemedi' });
  }
});

// Dashboard için son işlemleri getir
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const transactions = await BalanceTransaction.findAll({
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'phone']
      }, {
        model: User,
        as: 'createdByUser',
        attributes: ['id', 'fullName', 'username']
      }],
      order: [['createdAt', 'DESC']], // En yeni işlemler ilk
      limit: parseInt(limit)
    });
    
    res.json({
      transactions
    });
  } catch (error) {
    console.error('Son bakiye işlemleri getirilemedi:', error);
    res.status(500).json({ error: 'Son bakiye işlemleri getirilemedi' });
  }
});

module.exports = router;
