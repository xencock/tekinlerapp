const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// EAN-13 Yardımcı Fonksiyonları
const EAN13Utils = {
  /**
   * EAN-13 check digit hesaplama
   */
  calculateCheckDigit(barcode) {
    if (barcode.length !== 12) {
      throw new Error('Barkod 12 haneli olmalıdır');
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      // EAN-13: Pozisyon 1'den başlar, tek pozisyonlarda 1, çift pozisyonlarda 3 ile çarp
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
  },

  /**
   * EAN-13 barkod doğrulama
   */
  validateEAN13(barcode) {
    if (!barcode) return false;
    if (!/^\d{13}$/.test(barcode)) return false;

    const first12 = barcode.substring(0, 12);
    const checkDigit = parseInt(barcode[12]);
    const calculatedCheckDigit = this.calculateCheckDigit(first12);

    return checkDigit === calculatedCheckDigit;
  },

  /**
   * EAN-13 format kontrolü (check digit olmadan)
   */
  isValidEAN13Format(barcode) {
    if (!barcode) return false;
    return /^\d{13}$/.test(barcode);
  },

  /**
   * Kısmi barkod araması için format kontrolü
   */
  isValidPartialBarcode(barcode) {
    if (!barcode) return false;
    return /^\d+$/.test(barcode) && barcode.length >= 3 && barcode.length <= 13;
  },

  /**
   * EAN-13 formatını güzel gösterim
   */
  formatEAN13(barcode) {
    if (!this.validateEAN13(barcode)) {
      return barcode;
    }
    return `${barcode.substring(0, 3)} ${barcode.substring(3, 7)} ${barcode.substring(7, 12)} ${barcode[12]}`;
  },

  /**
   * Eksik check digit ile barkod tamamlama
   */
  completeEAN13(barcode) {
    if (!barcode || barcode.length !== 12) {
      return null;
    }
    
    try {
      const checkDigit = this.calculateCheckDigit(barcode);
      return barcode + checkDigit.toString();
    } catch (error) {
      return null;
    }
  }
};

// Kategori Bazlı Benzersiz Barkod Sistemi
const CategoryBarcodeSystem = {
  // Barkod counter - kategori bazında benzersizlik için
  _categoryCounters: {},
  
  // Benzersiz ID üretici (kategori bazında)
  generateUniqueId(category, length = 4) {
    // Her kategori için ayrı counter
    if (!this._categoryCounters[category]) {
      this._categoryCounters[category] = 0;
    }
    
    this._categoryCounters[category] = (this._categoryCounters[category] + 1) % 10000;
    const timestamp = Date.now() % 1000; // Son 3 hane
    const counter = this._categoryCounters[category];
    
    const uniqueValue = (timestamp * 10000 + counter) % Math.pow(10, length);
    return uniqueValue.toString().padStart(length, '0');
  },

  // Dinamik kategori kodları - veritabanından yüklenir
  categoryCodes: {},
  
  // Kategori kodlarını veritabanından yükle
  async loadCategoryCodes() {
    const Category = require('./Category');
    try {
      const categories = await Category.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC'], ['id', 'ASC']]
      });
      
      // Her kategori için 2 haneli kod oluştur
      this.categoryCodes = {};
      categories.forEach((category, index) => {
        const code = (index + 1).toString().padStart(2, '0');
        this.categoryCodes[category.name] = code;
      });
      
      console.log('Kategori kodları yüklendi:', this.categoryCodes);
      return this.categoryCodes;
    } catch (error) {
      console.error('Kategori kodları yüklenirken hata:', error);
      // Fallback - varsayılan kodlar
      this.categoryCodes = {
        'Tişört': '01',
        'Ceket': '02',
        'Kot': '03',
        'Jogger': '04',
        'T-Shirt': '05',
        'Gömlek': '06',
        'Pantolon': '07',
        'Sweatshirt': '08',
        'Kazak': '09',
        'Şort': '10',
        'Takım Elbise': '11'
      };
      return this.categoryCodes;
    }
  },



  // Eski sistemlerden kalan kodlar - artık kullanılmıyor
  brandCodes: {},
  seasonCodes: {},

  /**
   * Kategori bazlı benzersiz barkod üretimi
   */
  async generateCategoryBased(product) {
    // Kategori kodlarını yükle (cache edilmiş olabilir)
    if (Object.keys(this.categoryCodes).length === 0) {
      await this.loadCategoryCodes();
    }
    
    const countryCode = '868'; // Türkiye
    const companyCode = '100';
    const categoryCode = this.categoryCodes[product.category] || '00';
    
    let attempts = 0;
    let barcode = null;
    
    // Maksimum 100 deneme yaparak benzersiz barkod bul
    while (attempts < 100) {
      const uniqueId = this.generateUniqueId(product.category, 4);
      const first12 = countryCode + companyCode + categoryCode + uniqueId;
      const checkDigit = EAN13Utils.calculateCheckDigit(first12);
      const candidateBarcode = first12 + checkDigit.toString();
      
      // Benzersizlik kontrolü
      const existingProduct = await Product.findOne({ 
        where: { barcode: candidateBarcode } 
      });
      
      if (!existingProduct) {
        barcode = candidateBarcode;
        break;
      }
      
      attempts++;
    }
    
    if (!barcode) {
      throw new Error(`${product.category} kategorisi için benzersiz barkod oluşturulamadı`);
    }
    
    return barcode;
  },

  /**
   * Marka bazlı barkod üretimi
   */
  generateBrandBased(product) {
    const countryCode = '868';
    const brandCode = this.brandCodes[product.brand] || '000';
    const uniqueId = this.generateUniqueId(4).toString().padStart(4, '0');
    
    const first12 = countryCode + brandCode + uniqueId;
    const checkDigit = EAN13Utils.calculateCheckDigit(first12);
    
    return first12 + checkDigit.toString();
  },

  /**
   * Sezon bazlı barkod üretimi
   */
  generateSeasonBased(product) {
    const countryCode = '868';
    const companyCode = '100';
    const seasonCode = this.seasonCodes[product.season] || '00';
    const uniqueId = this.generateUniqueId(4).toString().padStart(4, '0');
    
    const first12 = countryCode + companyCode + seasonCode + uniqueId;
    const checkDigit = EAN13Utils.calculateCheckDigit(first12);
    
    return first12 + checkDigit.toString();
  },

  /**
   * Basit barkod üretimi (varsayılan)
   */
  generateDefault(product) {
    const countryCode = '868';
    const companyCode = '100';
    const uniqueId = this.generateUniqueId(4).toString().padStart(4, '0');
    
    const first12 = countryCode + companyCode + uniqueId;
    const checkDigit = EAN13Utils.calculateCheckDigit(first12);
    
    return first12 + checkDigit.toString();
  },

  /**
   * Kategori bazlı akıllı barkod üretimi
   */
  async generateSmartBarcode(product) {
    // Sadece kategori bazlı barkod üret
    if (product.category && this.categoryCodes[product.category]) {
      return await this.generateCategoryBased(product);
    } else {
      throw new Error('Barkod oluşturmak için kategori seçimi gereklidir');
    }
  },

  /**
   * Barkod anlamını çözümle
   */
  decodeBarcode(barcode) {
    if (!EAN13Utils.validateEAN13(barcode)) {
      return null;
    }

    const countryCode = barcode.substring(0, 3);
    const companyCode = barcode.substring(3, 7);
    const categoryCode = barcode.substring(7, 9);
    const colorCode = barcode.substring(9, 11);
    const sizeCode = barcode.substring(11, 13);
    
    return {
      country: countryCode,
      company: companyCode,
      category: this.getCategoryName(categoryCode),
      color: this.getColorName(colorCode),
      size: this.getSizeName(sizeCode)
    };
  },

  /**
   * Kodlardan isimleri al
   */
  getCategoryName(code) {
    return Object.keys(this.categoryCodes).find(key => this.categoryCodes[key] === code) || 'Bilinmeyen';
  },



  getBrandName(code) {
    return Object.keys(this.brandCodes).find(key => this.brandCodes[key] === code) || 'Bilinmeyen';
  },

  getSeasonName(code) {
    return Object.keys(this.seasonCodes).find(key => this.seasonCodes[key] === code) || 'Bilinmeyen';
  }
};

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200],
      notEmpty: true
    }
  },

  barcode: {
    type: DataTypes.STRING(13),
    allowNull: true,
    unique: true
  },

  // Tekstil kategorileri
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Genel'
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  season: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['Yaz', 'Kış', 'Dört Mevsim', null]]
    }
  },
  // Fiyat bilgileri
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },

  retailPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },

  // Stok bilgileri
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },




  // Ürün durumu
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },





}, {
  tableName: 'Products',
  indexes: [
    {
      fields: ['barcode']
    },

    {
      fields: ['category']
    },
    {
      fields: ['season']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['name']
    }
  ]
});

// Virtual fields
Product.prototype.isLowStock = function() {
  return this.currentStock <= 0;
};

Product.prototype.profitMargin = function() {
  if (this.costPrice === 0) return 0;
  return ((this.retailPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
};

Product.prototype.stockValue = function() {
  return (this.currentStock * this.costPrice).toFixed(2);
};





// Static methods
Product.getLowStockProducts = async function() {
  const products = await Product.findAll({
    where: {
      isActive: true
    }
  });
  
  return products.filter(product => product.isLowStock());
};

Product.getProductsByCategory = async function(category) {
  return await Product.findAll({
    where: {
      category: category,
      isActive: true
    },
    order: [['name', 'ASC']]
  });
};

Product.getProductsBySeason = async function(season) {
  return await Product.findAll({
    where: {
      season: season,
      isActive: true
    },
    order: [['name', 'ASC']]
  });
};



Product.searchProducts = async function(searchTerm) {
  const { Op } = require('sequelize');
  
  return await Product.findAll({
    where: {
      [Op.and]: [
        { isActive: true },
        {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },

            { barcode: { [Op.like]: `%${searchTerm}%` } },

            { category: { [Op.like]: `%${searchTerm}%` } },
            { brand: { [Op.like]: `%${searchTerm}%` } },
            { color: { [Op.like]: `%${searchTerm}%` } },
            { size: { [Op.like]: `%${searchTerm}%` } },
            { material: { [Op.like]: `%${searchTerm}%` } }
          ]
        }
      ]
    },
    order: [['name', 'ASC']]
  });
};

// Akıllı Barkod Sistemi Metodları
Product.prototype.validateEAN13Checksum = function(barcode) {
  return EAN13Utils.validateEAN13(barcode);
};

Product.generateBarcodeForProduct = async function(productId) {
  const product = await Product.findByPk(productId);
  if (product && product.category) {
    return await CategoryBarcodeSystem.generateSmartBarcode(product);
  }
  throw new Error('Ürün bulunamadı veya kategori seçili değil');
};

Product.prototype.ensureValidBarcode = async function() {
  if (!this.barcode || !EAN13Utils.validateEAN13(this.barcode)) {
    if (this.category) {
      this.barcode = await CategoryBarcodeSystem.generateSmartBarcode(this);
      await this.save();
    } else {
      throw new Error('Barkod oluşturmak için kategori gereklidir');
    }
  }
  return this.barcode;
};

Product.prototype.getFormattedBarcode = function() {
  return EAN13Utils.formatEAN13(this.barcode);
};

Product.prototype.getBarcodeInfo = function() {
  return CategoryBarcodeSystem.decodeBarcode(this.barcode);
};

Product.prototype.generateSmartBarcode = async function() {
  return await CategoryBarcodeSystem.generateSmartBarcode(this);
};

// Kategori bazlı barkod önerisi
Product.getBarcodeForCategory = async function(category) {
  // Kategori kodlarını yükle
  if (Object.keys(CategoryBarcodeSystem.categoryCodes).length === 0) {
    await CategoryBarcodeSystem.loadCategoryCodes();
  }
  
  // Kategori geçerli mi kontrol et
  if (!category) {
    return {
      success: false,
      error: 'Kategori seçimi gereklidir',
      category: category
    };
  }
  
  if (!CategoryBarcodeSystem.categoryCodes[category]) {
    return {
      success: false,
      error: `"${category}" kategorisi için barkod kodu bulunamadı. Mevcut kategoriler: ${Object.keys(CategoryBarcodeSystem.categoryCodes).join(', ')}`,
      category: category
    };
  }
  
  try {
    const tempProduct = { category: category };
    const barcode = await CategoryBarcodeSystem.generateCategoryBased(tempProduct);
    
    return {
      success: true,
      barcode: barcode,
      category: category,
      categoryCode: CategoryBarcodeSystem.categoryCodes[category],
      description: `${category} kategorisi için önerilen benzersiz barkod`,
      formatted: EAN13Utils.formatEAN13(barcode)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      category: category
    };
  }
};

// Hook: Ürün kaydedilmeden önce kategori bazlı barkod kontrolü
Product.addHook('beforeCreate', async (product) => {
  if (!product.barcode && product.category) {
    try {
      product.barcode = await CategoryBarcodeSystem.generateSmartBarcode(product);
    } catch (error) {
      console.error('Barkod oluşturma hatası:', error);
      throw new Error('Kategori bazlı barkod oluşturulamadı: ' + error.message);
    }
  }
});

// CategoryBarcodeSystem'i Product'a ekle
Product.CategoryBarcodeSystem = CategoryBarcodeSystem;

module.exports = Product;
