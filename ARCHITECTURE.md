# Tekinler App - Proje Mimarisi

## 📁 Yeni Dosya Yapısı

```
tekinlerapp/
├── config/                  # Konfigürasyon dosyaları
│   └── database.js         # Veritabanı konfigürasyonu
├── routes/                 # API route'ları (HTTP request handler'ları)
├── utils/                  # Yardımcı fonksiyonlar
│   ├── logger.js          # Logging sistemi
│   ├── response.js        # API response standartları
│   └── validation.js      # Validasyon fonksiyonları
├── middleware/             # Express middleware'leri
│   ├── auth.js            # Kimlik doğrulama
│   └── validation.js      # Request validasyonu
├── models/                 # Sequelize modelleri
│   ├── User.js
│   ├── Product.js
│   ├── Customer.js
│   └── ...
├── routes/                 # API route tanımları.
│   ├── auth.js
│   ├── products.js
│   └── ...
├── tests/                  # Test dosyaları
│   ├── setup.js           # Test konfigürasyonu
│   ├── helpers/           # Test yardımcıları
│   ├── unit/              # Unit testler
│   └── integration/       # Integration testler
├── logs/                   # Log dosyaları
│   ├── app/               # Uygulama logları
│   └── error/             # Hata logları
├── scripts/                # Veritabanı scriptleri
└── frontend/               # React frontend
```

## 🏗️ Mimari Katmanları

### 1. **Route Katmanı**
- HTTP request'leri handle eder
- Request validasyonu yapar
- İş mantığını doğrudan route handler'larda yapar
- Response formatlar

```javascript
// Örnek kullanım
router.get('/products', async (req, res) => {
  // İş mantığı burada
});
```

### 2. **Utils Katmanı**
- **Logger**: Merkezi logging sistemi
- **Response**: Standart API response formatları
- **Validation**: Ortak validasyon fonksiyonları

```javascript
// Örnek kullanım
const logger = require('./utils/logger');
const response = require('./utils/response');
const validation = require('./utils/validation');
```

## 🔧 Yeni Özellikler

### 📝 **Gelişmiş Logging**
```javascript
const logger = require('./utils/logger');

logger.info('User logged in', { userId: 123 });
logger.error('Database error', error, { context: 'user-creation' });
logger.debug('Processing request', { requestId: 'abc123' });
```

### ✅ **Standart API Responses**
```javascript
const response = require('./utils/response');

// Success response
return response.success(res, data, 'Operation successful');

// Error response
return response.error(res, 'Something went wrong', 400);

// Paginated response
return response.paginated(res, items, pagination);
```

### 🛡️ **Gelişmiş Validation**
```javascript
const validation = require('./utils/validation');

if (!validation.isValidTurkishPhone(phone)) {
  return response.error(res, 'Invalid phone number', 400);
}

if (!validation.isValidEAN13(barcode)) {
  return response.error(res, 'Invalid barcode', 400);
}
```

### 🧪 **Test Yapısı**
```bash
# Test yapısı kaldırıldı - sadece route handler'lar kullanılıyor
```

## 📊 **Avantajları**

### ✅ **Separation of Concerns**
- Her katman kendi sorumluluğuna odaklanır
- Kod daha organize ve maintainable
- Değişiklikler izole edilebilir

### ✅ **Reusability**
- Utils fonksiyonları tüm projede tekrar kullanılabilir
- Route handler'lar modüler yapıda

### ✅ **Simplicity**
- Basit ve anlaşılır mimari
- Daha az dosya ve karmaşıklık
- Mock'lama daha kolay
- Unit testler daha hızlı çalışır

### ✅ **Maintainability**
- Kod daha okunabilir
- Bug'lar daha kolay bulunur
- Yeni özellikler daha kolay eklenir

### ✅ **Scalability**
- Yeni modüller kolayca eklenebilir
- Mikroservis mimarisine geçiş daha kolay
- Team çalışması daha verimli

## 🚀 **Geçiş Planı**

### Phase 1: ✅ Tamamlandı
- [x] Klasör yapısı oluşturuldu
- [x] Utils katmanı hazırlandı
- [x] Base Service ve Controller'lar oluşturuldu
- [x] Logging sistemi kuruldu
- [x] Test yapısı hazırlandı

### Phase 2: 🔄 Devam Ediyor
- [ ] Tüm controller'lar oluşturulacak
- [ ] Route'lar yeni controller'lara bağlanacak
- [ ] Tüm service'lar tamamlanacak
- [ ] Integration testleri yazılacak

### Phase 3: 📋 Planlanan
- [ ] Middleware'ler güncellenecek
- [ ] Error handling geliştirilecek
- [ ] API documentation güncellenecek
- [ ] Performance optimizasyonları

## 📖 **Best Practices**

1. **Her katman sadece alt katmanı çağırmalı**
   - Controller → Service → Model
   - Service → Service (aynı seviyede)

2. **Error handling tutarlı olmalı**
   - Service'ler hata fırlatır
   - Controller'lar hataları yakalar ve response döner

3. **Logging her seviyede yapılmalı**
   - Critical işlemler loglanmalı
   - Debug bilgileri development'ta görünmeli


