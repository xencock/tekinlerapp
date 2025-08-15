const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Customer = require('../models/Customer');
const User = require('../models/User');
const SimpleCustomer = require('../models/SimpleCustomer');
const Sale = require('../models/Sale');
const BalanceTransaction = require('../models/BalanceTransaction');
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
      const term = search.trim();
      // Prefer prefix matching for better SQLite index usage; fallback to contains
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `${term}%` } },
        { lastName: { [Op.like]: `${term}%` } },
        { phone: { [Op.like]: `${term}%` } },
        { email: { [Op.like]: `${term}%` } },
        { tcNumber: { [Op.like]: `${term}%` } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get customers with pagination
    const customers = await Customer.findAll({
      where: whereClause,
      attributes: [
        'id','firstName','lastName','phone','email','tcNumber',
        'city','district','balance','totalPurchases','totalOrders',
        'smsPermission','emailPermission','isActive','createdAt','updatedAt'
      ],
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

// @route   GET /api/customers/deleted
// @desc    Silinen müşterileri listele
// @access  Private
router.get('/deleted', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Build where clause for deleted customers
    const whereClause = {
      isActive: false
    };

    if (search) {
      const term = search.trim();
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `${term}%` } },
        { lastName: { [Op.like]: `${term}%` } },
        { phone: { [Op.like]: `${term}%` } },
        { email: { [Op.like]: `${term}%` } },
        { tcNumber: { [Op.like]: `${term}%` } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get deleted customers with pagination
    const customers = await Customer.findAll({
      where: whereClause,
      attributes: [
        'id','firstName','lastName','phone','email','tcNumber',
        'city','district','balance','totalPurchases','totalOrders',
        'smsPermission','emailPermission','isActive','createdAt','updatedAt'
      ],
      order: [[sortBy, sortOrder]],
      offset: skip,
      limit: limit,
      include: [
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
    console.error('Get deleted customers error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Silinen müşteriler alınamadı'
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

    res.status(201).json({
      message: 'Müşteri başarıyla oluşturuldu',
      customer: {
        ...customer.toJSON(),
        fullName: customer.getFullName()
      }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri oluşturulamadı'
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Müşteri bilgilerini güncelle
// @access  Private
router.put('/:id', authenticateToken, validateCustomerUpdate, async (req, res) => {
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

    // Check if phone already exists (if provided and changed)
    if (phone && phone.trim() && phone !== customer.phone) {
      const existingCustomer = await SimpleCustomer.findByPhone(phone);
      if (existingCustomer) {
        return res.status(400).json({
          error: 'Müşteri hatası',
          message: 'Bu telefon numarası ile kayıtlı müşteri bulunmaktadır'
        });
      }
    }

    // Check if email already exists (if provided and changed)
    if (email && email !== customer.email) {
      const existingEmail = await SimpleCustomer.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          error: 'Müşteri hatası',
          message: 'Bu e-posta adresi ile kayıtlı müşteri bulunmaktadır'
        });
      }
    }

    // Check if TC number already exists (if provided and changed)
    if (tcNumber && tcNumber.trim() && tcNumber !== customer.tcNumber) {
      const existingTC = await SimpleCustomer.findByTC(tcNumber);
      if (existingTC) {
        return res.status(400).json({
          error: 'Müşteri hatası',
          message: 'Bu TC kimlik numarası ile kayıtlı müşteri bulunmaktadır'
        });
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

    res.json({
      message: 'Müşteri başarıyla güncellendi',
      customer: {
        ...customer.toJSON(),
        fullName: customer.getFullName()
      }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri güncellenemedi'
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

// @route   POST /api/customers/:id/restore
// @desc    Silinen müşteriyi geri yükle
// @access  Private
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Müşteri bulunamadı',
        message: 'Belirtilen ID ile müşteri bulunamadı'
      });
    }

    // Check if customer is already active
    if (customer.isActive) {
      return res.status(400).json({
        error: 'Müşteri hatası',
        message: 'Müşteri zaten aktif durumda'
      });
    }

    // Check for conflicts with active customers
    const conflicts = [];
    
    if (customer.phone) {
      const phoneConflict = await Customer.findOne({
        where: {
          phone: customer.phone,
          isActive: true,
          id: { [Op.ne]: customer.id }
        }
      });
      if (phoneConflict) {
        conflicts.push('telefon numarası');
      }
    }

    if (customer.email) {
      const emailConflict = await Customer.findOne({
        where: {
          email: customer.email,
          isActive: true,
          id: { [Op.ne]: customer.id }
        }
      });
      if (emailConflict) {
        conflicts.push('e-posta adresi');
      }
    }

    if (customer.tcNumber) {
      const tcConflict = await Customer.findOne({
        where: {
          tcNumber: customer.tcNumber,
          isActive: true,
          id: { [Op.ne]: customer.id }
        }
      });
      if (tcConflict) {
        conflicts.push('TC kimlik numarası');
      }
    }

    if (conflicts.length > 0) {
      return res.status(400).json({
        error: 'Çakışma hatası',
        message: `Bu ${conflicts.join(', ')} ile aktif bir müşteri bulunmaktadır. Önce o müşteriyi silin veya bilgilerini değiştirin.`
      });
    }

    // Restore customer
    await customer.update({
      isActive: true,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Müşteri başarıyla geri yüklendi',
      customer: {
        ...customer.toJSON(),
        fullName: customer.getFullName()
      }
    });

  } catch (error) {
    console.error('Restore customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri geri yüklenemedi'
    });
  }
});

// @route   DELETE /api/customers/:id/permanent
// @desc    Müşteriyi kalıcı olarak sil
// @access  Private
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Müşteri bulunamadı',
        message: 'Belirtilen ID ile müşteri bulunamadı'
      });
    }

    // Check if customer has sales history
    const salesCount = await Sale.count({
      where: { customerId: customer.id }
    });

    if (salesCount > 0) {
      return res.status(400).json({
        error: 'Silme hatası',
        message: 'Bu müşterinin satış geçmişi bulunmaktadır. Kalıcı olarak silinemez.'
      });
    }

    // Check and delete balance transactions
    const balanceTransactionsCount = await BalanceTransaction.count({
      where: { customerId: customer.id }
    });

    if (balanceTransactionsCount > 0) {
      // Delete balance transactions first
      await BalanceTransaction.destroy({
        where: { customerId: customer.id }
      });
      console.log(`Deleted ${balanceTransactionsCount} balance transactions for customer ${customer.id}`);
    }

    // Permanent delete customer
    await customer.destroy();

    res.json({
      message: 'Müşteri kalıcı olarak silindi',
      deletedTransactions: balanceTransactionsCount
    });

  } catch (error) {
    console.error('Permanent delete customer error:', error);
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Müşteri kalıcı olarak silinemedi'
    });
  }
});

module.exports = router;
