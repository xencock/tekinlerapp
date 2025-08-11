/**
 * Common Validation Utilities
 * Reusable validation functions for the application
 */

/**
 * Validate Turkish phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidTurkishPhone = (phone) => {
  if (!phone) return false;
  
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Turkish phone number patterns
  const patterns = [
    /^0[5][0-9]{9}$/, // 05XXXXXXXXX
    /^[5][0-9]{9}$/, // 5XXXXXXXXX
    /^\+90[5][0-9]{9}$/, // +905XXXXXXXXX
    /^90[5][0-9]{9}$/ // 905XXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Validate Turkish TC Number
 * @param {string} tcNumber - TC number to validate
 * @returns {boolean} - True if valid
 */
const isValidTCNumber = (tcNumber) => {
  if (!tcNumber || tcNumber.length !== 11) return false;
  
  // TC number cannot start with 0
  if (tcNumber[0] === '0') return false;
  
  // All digits must be numeric
  if (!/^\d{11}$/.test(tcNumber)) return false;
  
  // TC number algorithm validation
  const digits = tcNumber.split('').map(Number);
  
  // Sum of first 10 digits
  const sum1 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
  
  // Check 11th digit
  if (sum1 % 10 !== digits[10]) return false;
  
  // Sum of odd positioned digits (1st, 3rd, 5th, 7th, 9th)
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  
  // Sum of even positioned digits (2nd, 4th, 6th, 8th)
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  
  // Check 10th digit
  const check = (oddSum * 7 - evenSum) % 10;
  if (check !== digits[9]) return false;
  
  return true;
};

/**
 * Validate EAN-13 barcode
 * @param {string} barcode - Barcode to validate
 * @returns {boolean} - True if valid
 */
const isValidEAN13 = (barcode) => {
  if (!barcode || !/^\d{13}$/.test(barcode)) return false;
  
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop();
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return checkDigit === calculatedCheckDigit;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate strong password
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with details
 */
const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };
  
  if (!password) {
    result.isValid = false;
    result.errors.push('Password is required');
    return result;
  }
  
  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }
  
  return result;
};

/**
 * Validate PIN (4 digits)
 * @param {string} pin - PIN to validate
 * @returns {boolean} - True if valid
 */
const isValidPIN = (pin) => {
  return /^\d{4}$/.test(pin);
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags completely
    .substring(0, 1000); // Limit length
};

/**
 * Validate price value
 * @param {number} price - Price to validate
 * @returns {boolean} - True if valid
 */
const isValidPrice = (price) => {
  return typeof price === 'number' && price >= 0 && price <= 999999.99;
};

/**
 * Validate stock quantity
 * @param {number} stock - Stock quantity to validate
 * @returns {boolean} - True if valid
 */
const isValidStock = (stock) => {
  return Number.isInteger(stock) && stock >= 0 && stock <= 999999;
};

module.exports = {
  isValidTurkishPhone,
  isValidTCNumber,
  isValidEAN13,
  isValidEmail,
  validatePassword,
  isValidPIN,
  sanitizeString,
  isValidPrice,
  isValidStock
};
