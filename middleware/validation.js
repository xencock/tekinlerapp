const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validasyon hatası',
      message: 'Girilen bilgiler hatalı',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// User creation validation
const validateUserCreation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı 3-30 karakter arasında olmalı')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  body('pin')
    .matches(/^[0-9]{6}$/)
    .withMessage('PIN 6 haneli rakam olmalı'),
  
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ad soyad 2-100 karakter arasında olmalı'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir telefon numarası girin'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı gerekli'),
  
  body('pin')
    .matches(/^[0-9]{6}$/)
    .withMessage('PIN 6 haneli rakam olmalı'),
  
  handleValidationErrors
];

// PIN change validation
const validatePinChange = [
  body('currentPin')
    .matches(/^[0-9]{6}$/)
    .withMessage('Mevcut PIN 6 haneli rakam olmalı'),
  
  body('newPin')
    .matches(/^[0-9]{6}$/)
    .withMessage('Yeni PIN 6 haneli rakam olmalı'),
  
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı 3-30 karakter arasında olmalı')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ad soyad 2-100 karakter arasında olmalı'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir telefon numarası girin'),

  body('pin')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('PIN 6 haneli rakam olmalı'),
  
  handleValidationErrors
];

// Customer validation
const validateCustomer = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Ad sadece harf içerebilir'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Soyad sadece harf içerebilir'),
  
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefon numarası 10-15 karakter arasında olmalı')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir telefon numarası girin (örn: 0555 123 45 67)'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  
  body('tcNumber')
    .optional()
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('TC kimlik numarası 11 haneli olmalı')
    .matches(/^[0-9]{11}$/)
    .withMessage('TC kimlik numarası sadece rakam içerebilir'),
  
  handleValidationErrors
];

// Customer update validation
const validateCustomerUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Ad sadece harf içerebilir'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalı')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Soyad sadece harf içerebilir'),
  
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefon numarası 10-15 karakter arasında olmalı')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir telefon numarası girin (örn: 0555 123 45 67)'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  
  body('tcNumber')
    .optional()
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('TC kimlik numarası 11 haneli olmalı')
    .matches(/^[0-9]{11}$/)
    .withMessage('TC kimlik numarası sadece rakam içerebilir'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserCreation,
  validateLogin,
  validatePinChange,
  validateUserUpdate,
  validateCustomer,
  validateCustomerUpdate
};
