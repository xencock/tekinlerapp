# Tekinler İş Yeri Yönetim Sistemi - Backend

Bu proje, Tekinler iş yeri için geliştirilmiş kapsamlı bir stok takip ve envanter yönetim sisteminin backend API'sidir.

## 🚀 Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ JWT tabanlı kimlik doğrulama
- ✅ Güvenli şifre hashleme
- ✅ Kullanıcı yönetimi (CRUD işlemleri)
- ✅ Input validasyonu
- ✅ Hata yönetimi
- ✅ SQLite veritabanı entegrasyonu
- ✅ RESTful API

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- SQLite (otomatik yüklenir)
- npm veya yarn

## 🛠️ Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd tekinlerapp
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Environment dosyasını oluşturun
```bash
cp env.example .env
```

### 4. Environment değişkenlerini düzenleyin
`.env` dosyasını açın ve gerekli değerleri girin:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SQLite Database
DB_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
```

### 5. Veritabanını hazırlayın
```bash
# Hızlı kurulum (veritabanı + admin kullanıcı + kategoriler)
npm run setup

# Veya adım adım:
npm run sync-db        # Veritabanı tablolarını oluştur
npm run create-admin   # Admin kullanıcısı oluştur (admin/1234)
npm run seed-categories # Kategorileri ekle
npm run seed-customers  # Örnek müşteriler ekle (opsiyonel)
```

### 6. Uygulamayı başlatın
```bash
# Development modu
npm run dev

# Production modu
npm start
```

## 📱 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Kullanıcı kaydı | Public |
| POST | `/api/auth/login` | Kullanıcı girişi | Public |
| POST | `/api/auth/logout` | Kullanıcı çıkışı | Private |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgileri | Private |
| POST | `/api/auth/change-password` | Şifre değiştirme | Private |
| POST | `/api/auth/refresh-token` | Token yenileme | Private |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Tüm kullanıcıları listele | Private |
| GET | `/api/users/:id` | Belirli kullanıcıyı getir | Private |
| PUT | `/api/users/:id` | Kullanıcı güncelle | Private |
| DELETE | `/api/users/:id` | Kullanıcıyı deaktif et | Private |
| PATCH | `/api/users/:id/activate` | Kullanıcıyı aktif et | Private |

### Products

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/products` | Ürünleri listele (pagination, search, filter) | Private |
| GET | `/api/products/:id` | Belirli ürünü getir | Private |
| POST | `/api/products` | Yeni ürün oluştur | Private |
| PUT | `/api/products/:id` | Ürün güncelle | Private |
| DELETE | `/api/products/:id` | Ürün sil | Private |
| GET | `/api/products/barcode/:barcode` | Barkod ile ürün ara | Private |
| POST | `/api/products/bulk-update` | Toplu ürün güncelleme | Private |

### Categories

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/categories` | Tüm kategorileri listele | Private |
| GET | `/api/categories/:id` | Belirli kategoriyi getir | Private |
| POST | `/api/categories` | Yeni kategori oluştur | Private |
| PUT | `/api/categories/:id` | Kategori güncelle | Private |
| DELETE | `/api/categories/:id` | Kategori sil | Private |

### Customers

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/customers` | Müşterileri listele (pagination, search, filter) | Private |
| GET | `/api/customers/:id` | Belirli müşteriyi getir | Private |
| POST | `/api/customers` | Yeni müşteri oluştur | Private |
| PUT | `/api/customers/:id` | Müşteri güncelle | Private |
| DELETE | `/api/customers/:id` | Müşteri sil | Private |
| GET | `/api/customers/search/:query` | Müşteri ara | Private |

### Sales

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/sales` | Satışları listele | Private |
| GET | `/api/sales/:id` | Belirli satışı getir | Private |
| POST | `/api/sales` | Yeni satış oluştur | Private |
| PUT | `/api/sales/:id` | Satış güncelle | Private |
| DELETE | `/api/sales/:id` | Satış sil | Private |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API durumu kontrolü |

## 🔐 Güvenlik Özellikleri

- **JWT Token**: Güvenli token tabanlı kimlik doğrulama
- **Password Hashing**: bcrypt ile şifre hashleme
- **Input Validation**: Express-validator ile giriş doğrulama
- **Rate Limiting**: Hesap kilitleme (5 başarısız giriş denemesi)
- **CORS**: Cross-origin resource sharing koruması
- **Helmet**: Güvenlik başlıkları

## 📊 Veritabanı Şeması (SQLite + Sequelize)

### User Model
```javascript
{
  id: Integer (primary key, auto increment),
  username: String (unique, required),
  pin: String (required, 4 digits),
  fullName: String (required),
  phone: String (optional),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  id: Integer (primary key, auto increment),
  name: String (required),
  barcode: String (unique, EAN-13),
  category: String (required),
  brand: String,
  season: String,
  costPrice: Decimal,
  retailPrice: Decimal (required),
  currentStock: Integer (default: 0),
  minStockLevel: Integer (default: 5),
  createdAt: Date,
  updatedAt: Date
}
```

### Customer Model
```javascript
{
  id: Integer (primary key, auto increment),
  customerCode: String (unique, auto-generated),
  firstName: String (required),
  lastName: String (required),
  phone: String,
  email: String,
  tcNumber: String,
  address: String,
  city: String,
  district: String,
  postalCode: String,
  totalPurchases: Decimal (default: 0),
  totalOrders: Integer (default: 0),
  lastPurchaseDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  id: Integer (primary key, auto increment),
  name: String (unique, required),
  description: String,
  sortOrder: Integer,
  createdAt: Date,
  updatedAt: Date
}
```

### Sale Model
```javascript
{
  id: Integer (primary key, auto increment),
  saleNumber: String (unique, auto-generated),
  customerId: Integer (foreign key),
  userId: Integer (foreign key),
  totalAmount: Decimal (required),
  paymentMethod: Enum ['Nakit', 'Kart', 'Havale'],
  status: Enum ['Tamamlandı', 'İptal', 'İade'] (default: 'Tamamlandı'),
  notes: Text,
  saleDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Test

```bash
# Testleri çalıştır
npm test
```

## 📝 API Kullanım Örnekleri

### Kullanıcı Kaydı
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@tekinler.com",
    "password": "Admin123",
    "fullName": "Admin User",
    "phone": "0555 123 45 67"
  }'
```

### Kullanıcı Girişi
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tekinler.com",
    "password": "Admin123"
  }'
```

### Kullanıcı Listesi (Token ile)
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Geliştirme

### Proje Yapısı
```
├── config/          # Veritabanı konfigürasyonu
├── models/          # Sequelize modelleri (SQLite)
├── routes/          # API route'ları
├── middleware/      # Middleware fonksiyonları
├── scripts/         # Veritabanı setup scriptleri
├── frontend/        # React frontend uygulaması
├── server.js        # Ana server dosyası
├── database.sqlite  # SQLite veritabanı dosyası
├── package.json     # Backend bağımlılıkları
└── README.md        # Bu dosya
```

### Yeni Route Ekleme
1. `routes/` klasöründe yeni route dosyası oluşturun
2. `server.js`'de route'u import edin
3. `app.use()` ile route'u ekleyin

### Yeni Model Ekleme
1. `models/` klasöründe yeni model dosyası oluşturun
2. Mongoose şemasını tanımlayın
3. Route'larda modeli kullanın

## 🚀 Deployment

### Production için hazırlık
1. `NODE_ENV=production` ayarlayın
2. Güçlü bir `JWT_SECRET` kullanın
3. MongoDB production bağlantısı yapın
4. SSL sertifikası ekleyin

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-very-secure-secret
CORS_ORIGIN=https://your-frontend-domain.com
```
