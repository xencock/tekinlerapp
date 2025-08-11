# Tekinler İş Yeri Yönetim Sistemi - Frontend

Bu proje, Tekinler iş yeri için geliştirilmiş stok takip ve envanter yönetim sisteminin React.js frontend uygulamasıdır.

## 🚀 Özellikler

- ✅ Modern React.js uygulaması
- ✅ Responsive tasarım (Tailwind CSS)
- ✅ Kullanıcı girişi ve kimlik doğrulama
- ✅ Dashboard ve istatistikler
- ✅ Sidebar navigasyon
- ✅ Toast bildirimleri
- ✅ Form validasyonu
- ✅ API entegrasyonu

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- Backend API (çalışır durumda olmalı)

## 🛠️ Kurulum

### 1. Bağımlılıkları yükleyin
```bash
cd frontend
npm install
```

### 2. Environment değişkenlerini ayarlayın
`.env` dosyası oluşturun:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Uygulamayı başlatın
```bash
npm start
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   └── Layout.js       # Ana layout bileşeni
├── contexts/           # React context'leri
│   └── AuthContext.js  # Kimlik doğrulama context'i
├── pages/              # Sayfa bileşenleri
│   ├── Login.js        # Giriş sayfası
│   └── Dashboard.js    # Ana dashboard
├── utils/              # Utility fonksiyonları
│   └── api.js          # API istekleri
├── App.js              # Ana uygulama bileşeni
├── index.js            # Uygulama giriş noktası
└── index.css           # Ana CSS dosyası
```

## 🎨 Tasarım Sistemi

### Renkler
- **Primary**: Mavi tonları (#3B82F6)
- **Secondary**: Gri tonları (#64748B)
- **Success**: Yeşil (#10B981)
- **Error**: Kırmızı (#EF4444)
- **Warning**: Turuncu (#F59E0B)

### Bileşenler
- **Button**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Input**: `.input`
- **Card**: `.card`, `.card-header`, `.card-body`

## 🔐 Kimlik Doğrulama

Uygulama JWT token tabanlı kimlik doğrulama kullanır:

1. Kullanıcı giriş yapar
2. Token localStorage'a kaydedilir
3. Tüm API isteklerinde token otomatik eklenir
4. Token geçersizse kullanıcı login sayfasına yönlendirilir

## 📱 Responsive Tasarım

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🧪 Test

```bash
# Testleri çalıştır
npm test

# Production build
npm run build
```

## 🔧 Geliştirme

### Yeni Sayfa Ekleme
1. `pages/` klasöründe yeni sayfa bileşeni oluşturun
2. `App.js`'de route ekleyin
3. `Layout.js`'de navigasyon menüsüne ekleyin

### Yeni Bileşen Ekleme
1. `components/` klasöründe yeni bileşen oluşturun
2. Gerekirse CSS sınıfları ekleyin
3. Bileşeni kullanacağınız yerde import edin

### API Entegrasyonu
1. `utils/api.js`'de yeni API fonksiyonları ekleyin
2. Bileşenlerde API fonksiyonlarını kullanın
3. Hata yönetimi için try-catch kullanın

## 🚀 Production Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

### Hosting
- Netlify
- Vercel
- AWS S3 + CloudFront
- Firebase Hosting

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Console hatalarını kontrol edin
2. Network sekmesinde API isteklerini kontrol edin
3. Backend API'nin çalıştığından emin olun

## 📄 Lisans

MIT License

---

**Not:** Bu frontend uygulaması backend API ile birlikte çalışır. Backend'in çalışır durumda olduğundan emin olun. 