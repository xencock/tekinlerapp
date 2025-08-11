const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Customer = require('../models/Customer');
const User = require('../models/User');
const SimpleCustomer = require('../models/SimpleCustomer');
const { authenticateToken } = require('../middleware/auth');
const { validateCustomer, validateCustomerUpdate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/customers
// @desc    Tüm müşterileri listele
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Build where clause
    const whereClause = {
      isActive: true
    };

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { tcNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get customers with pagination
    const customers = await Customer.findAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      offset: skip,
      limit: limit,
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'username', 'fullName'],
          required: false
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'username', 'fullName'],
          required: false
        }
      ]
    });

    // Get total count for pagination
    const total = await Customer.count({ where: whereClause });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Add calculated fields to customers
    const customersWithCalculations = customers.map(customer => ({
      ...customer.toJSON(),
      fullName: customer.getFullName(),
      balanceStatus: customer.getBalanceStatus(),
      balanceColor: customer.getBalanceColor()
    }));

    res.json({
      customers: customersWithCalculations,
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers: total,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteriler alınamadı'
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Belirli müşteriyi getir
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Müşteri bulunamadı',
        message: 'Belirtilen ID ile müşteri bulunamadı'
      });
    }

    const customerData = {
      ...customer.toJSON(),
      fullName: customer.getFullName(),
      balanceStatus: customer.getBalanceStatus(),
      balanceColor: customer.getBalanceColor()
    };

    res.json({ customer: customerData });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri bilgileri alınamadı'
    });
  }
});

// @route   POST /api/customers
// @desc    Yeni müşteri oluştur
// @access  Private
router.post('/', authenticateToken, validateCustomer, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      tcNumber,
      address,
      city,
      district,
      postalCode,
      preferredColors,
      preferredBrands,
      smsPermission,
      emailPermission,
      notes
    } = req.body;

    // Check if phone already exists (if provided)
    if (phone && phone.trim()) {
      const existingCustomer = await SimpleCustomer.findByPhone(phone);
      if (existingCustomer) {
        return res.status(400).json({
          error: 'Müşteri hatası',
          message: 'Bu telefon numarası ile kayıtlı müşteri bulunmaktadır'
        });
      }
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await SimpleCustomer.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          error: 'Müşteri hatası',
          message: 'Bu e-posta adresi ile kayıtlı müşteri bulunmaktadır'
        });
      }
    }

    // Check if TC number already exists (if provided)
    if (tcNumber && tcNumber.trim()) {
      const existingTC = await SimpleCustomer.findByTC(tcNumber);
      if (existingTC) {
        return res.status(400).json({
          error: 'Müşteri hatası',
          message: 'Bu TC kimlik numarası ile kayıtlı müşteri bulunmaktadır'
        });
      }
    }

    // Create customer
    const customer = await SimpleCustomer.create({
      firstName,
      lastName,
      phone,
      email,
      tcNumber,
      address,
      city,
      district,
      postalCode,
      preferredColors,
      preferredBrands,
      smsPermission,
      emailPermission,
      notes,
      createdBy: req.user.id
    });

    // Normalize returned customer (works for both Sequelize model and SimpleCustomer plain object)
    const base = (customer && typeof customer.toJSON === 'function') ? customer.toJSON() : customer;
    const safeParseJSON = (value) => {
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return value; }
      }
      return value;
    };

    const totalPurchases = parseFloat(base?.totalPurchases || 0);
    const totalOrders = parseInt(base?.totalOrders || 0);

    const customerData = {
      ...base,
      preferredColors: safeParseJSON(base?.preferredColors),
      preferredBrands: safeParseJSON(base?.preferredBrands),
      fullName: (customer && typeof customer.getFullName === 'function')
        ? customer.getFullName()
        : `${base?.firstName || ''} ${base?.lastName || ''}`.trim(),
      customerSegment: (customer && typeof customer.getCustomerSegment === 'function')
        ? customer.getCustomerSegment()
        : (totalPurchases >= 1000 ? 'Premium' : totalPurchases >= 500 ? 'Gold' : totalPurchases >= 100 ? 'Silver' : 'Bronze'),
      averageOrderValue: (customer && typeof customer.getAverageOrderValue === 'function')
        ? customer.getAverageOrderValue()
        : (totalOrders === 0 ? 0 : (totalPurchases / totalOrders).toFixed(2))
    };

    res.status(201).json({
      message: 'Müşteri başarıyla oluşturuldu',
      customer: customerData
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri oluşturulamadı',
      details: error?.message || 'Unknown error'
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Müşteri bilgilerini güncelle
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Müşteri bulunamadı',
        message: 'Belirtilen ID ile müşteri bulunamadı'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      email,
      tcNumber,
      address,
      city,
      district,
      postalCode,
      preferredColors,
      preferredBrands,
      smsPermission,
      emailPermission,
      notes
    } = req.body;

    // Helper function to normalize phone numbers
    const normalizePhone = (phoneNumber) => {
      if (!phoneNumber) return '';
      return phoneNumber.replace(/[\s\-\(\)]/g, '').trim();
    };

    // Check if phone already exists (excluding current customer)
    if (phone && phone.trim()) {
      const normalizedNewPhone = normalizePhone(phone);
      const normalizedCurrentPhone = normalizePhone(customer.phone);
      
      if (normalizedNewPhone && normalizedNewPhone !== normalizedCurrentPhone) {
        const existingCustomer = await Customer.findOne({
          where: {
            phone: phone.trim(),
            id: { [Op.ne]: req.params.id },
            isActive: true
          }
        });
        if (existingCustomer) {
          return res.status(400).json({
            error: 'Müşteri hatası',
            message: 'Bu telefon numarası ile kayıtlı başka bir müşteri bulunmaktadır'
          });
        }
      }
    }

    // Check if email already exists (excluding current customer)
    if (email && email.trim()) {
      const trimmedNewEmail = email.trim().toLowerCase();
      const trimmedCurrentEmail = customer.email ? customer.email.trim().toLowerCase() : '';
      
      if (trimmedNewEmail && trimmedNewEmail !== trimmedCurrentEmail) {
        const existingEmail = await Customer.findOne({
          where: {
            email: email.trim(),
            id: { [Op.ne]: req.params.id },
            isActive: true
          }
        });
        if (existingEmail) {
          return res.status(400).json({
            error: 'Müşteri hatası',
            message: 'Bu e-posta adresi ile kayıtlı başka bir müşteri bulunmaktadır'
          });
        }
      }
    }

    // Check if TC number already exists (excluding current customer)
    if (tcNumber && tcNumber.trim()) {
      const trimmedNewTC = tcNumber.trim();
      const trimmedCurrentTC = customer.tcNumber ? customer.tcNumber.trim() : '';
      
      if (trimmedNewTC && trimmedNewTC !== trimmedCurrentTC) {
        const existingTC = await Customer.findOne({
          where: {
            tcNumber: tcNumber.trim(),
            id: { [Op.ne]: req.params.id },
            isActive: true
          }
        });
        if (existingTC) {
          return res.status(400).json({
            error: 'Müşteri hatası',
            message: 'Bu TC kimlik numarası ile kayıtlı başka bir müşteri bulunmaktadır'
          });
        }
      }
    }

    // Update customer
    await customer.update({
      firstName,
      lastName,
      phone,
      email,
      tcNumber,
      address,
      city,
      district,
      postalCode,
      preferredColors,
      preferredBrands,
      smsPermission,
      emailPermission,
      notes,
      updatedBy: req.user.id
    });

    // Reload the customer to get fresh data
    await customer.reload();

    const customerData = {
      ...customer.toJSON(),
      fullName: customer.getFullName(),
      customerSegment: customer.getCustomerSegment(),
      averageOrderValue: customer.getAverageOrderValue()
    };

    res.json({
      message: 'Müşteri başarıyla güncellendi',
      customer: customerData
    });

  } catch (error) {
    console.error('Update customer error:', error);
    
    // Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation hatası',
        message: 'Girilen bilgiler geçersiz',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    // Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      let message = 'Bu bilgi zaten kullanılıyor';
      
      if (field === 'phone') message = 'Bu telefon numarası zaten kayıtlı';
      else if (field === 'email') message = 'Bu e-posta adresi zaten kayıtlı';
      else if (field === 'tcNumber') message = 'Bu TC kimlik numarası zaten kayıtlı';
      
      return res.status(400).json({
        error: 'Müşteri hatası',
        message: message
      });
    }
    
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri güncellenemedi',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Müşteriyi sil (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Müşteri bulunamadı',
        message: 'Belirtilen ID ile müşteri bulunamadı'
      });
    }

    // Soft delete
    await customer.update({ 
      isActive: false,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Müşteri başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri silinemedi'
    });
  }
});

// @route   GET /api/customers/search/phone/:phone
// @desc    Telefon numarası ile müşteri ara
// @access  Private
router.get('/search/phone/:phone', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByPhone(req.params.phone);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Müşteri bulunamadı',
        message: 'Bu telefon numarası ile kayıtlı müşteri bulunamadı'
      });
    }

    const customerData = {
      ...customer.toJSON(),
      fullName: customer.getFullName(),
      customerSegment: customer.getCustomerSegment(),
      averageOrderValue: customer.getAverageOrderValue()
    };

    res.json({ customer: customerData });

  } catch (error) {
    console.error('Search customer by phone error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri aranamadı'
    });
  }
});

// @route   GET /api/customers/filters/options
// @desc    Filtre seçeneklerini getir
// @access  Private
router.get('/filters/options', authenticateToken, async (req, res) => {
  try {
    const cities = await Customer.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('city')), 'city']],
      where: { isActive: true, city: { [Op.ne]: null } },
      raw: true
    });

    res.json({
      cities: cities.map(item => item.city)
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Filtre seçenekleri alınamadı'
    });
  }
});

// @route   GET /api/customers/stats/overview
// @desc    Müşteri istatistiklerini getir
// @access  Private
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalCustomers = await Customer.count({ where: { isActive: true } });
    const newCustomers = await Customer.count({ 
      where: { 
        isActive: true,
        createdAt: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      } 
    });

    // Bu ayın başlangıcını hesapla
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Bu ayki toplam borçları hesapla
    const BalanceTransaction = require('../models/BalanceTransaction');
    const thisMonthDebtTotal = await BalanceTransaction.sum('amount', {
      where: {
        type: 'debt',
        date: {
          [Op.gte]: startOfMonth
        }
      }
    });

    res.json({
      totalCustomers,
      newCustomers,
      totalRevenue: thisMonthDebtTotal || 0
    });

  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri istatistikleri alınamadı'
    });
  }
});

module.exports = router; 