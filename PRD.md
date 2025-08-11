# Tekinler İş Yeri Yönetim Uygulaması - PRD (Product Requirements Document)

## 📋 Proje Genel Bakış

**Proje Adı:** Tekinler İş Yeri Yönetim Sistemi  
**Versiyon:** 1.0  
**Tarih:** 2025 
**Hedef Kullanıcılar:** 3-4 kullanıcı (iş yeri sahibi ve çalışanları)  
**Platformlar:** iOS (mobil) ve Web (masaüstü)  

## 🎯 Proje Amacı

İş yerinde stok takibi, envanter yönetimi, satış işlemleri, müşteri yönetimi ve barkod sistemi entegrasyonu ile kapsamlı bir yönetim sistemi oluşturmak. Sistem hem mobil hem de web platformlarından erişilebilir olacak ve gerçek zamanlı veri senkronizasyonu sağlayacak.

## 👥 Hedef Kullanıcılar

- **İş Yeri Sahibi ve Çalışanları:** Tüm kullanıcılar aynı yetkilere sahip olacak
- **Kullanıcı Sayısı:** 3-4 kullanıcı
- **Erişim:** Hem web hem mobil platformlardan tam erişim

## 🏗️ Sistem Mimarisi

### Teknoloji Stack
- **Backend:** Node.js + Express.js + SQLite (MongoDB yerine SQLite kullanılıyor)
- **Frontend (Web):** React.js + JavaScript (TypeScript yerine JavaScript kullanılıyor)
- **Mobile (iOS):** React Native + TypeScript
- **Veritabanı:** SQLite (NoSQL yerine SQLite kullanılıyor)
- **Barkod API:** JsBarcode + ZXing
- **Authentication:** JWT Token
- **Real-time:** Socket.io (henüz implement edilmedi)
- **Cloud:** AWS/Azure (hosting)

## 📱 Temel Özellikler

### 1. Kullanıcı Yönetimi ve Güvenlik
- [x] Kullanıcı kayıt/giriş sistemi
- [x] Basit kullanıcı yönetimi (tüm kullanıcılar aynı yetki)
- [ ] Şifre sıfırlama
- [x] Oturum yönetimi
- [ ] İki faktörlü doğrulama (opsiyonel)

### 2. Stok ve Envanter Yönetimi
- [x] Ürün ekleme/düzenleme/silme
- [x] Kategori yönetimi
- [x] Stok miktarı takibi
- [x] Minimum stok uyarıları
- [x] Stok giriş/çıkış işlemleri
- [ ] Toplu ürün import/export
- [x] Ürün arama ve filtreleme
- [x] Stok raporları

### 3. Barkod Sistemi
- [x] Barkod oluşturma (QR, Code128, EAN13)
- [x] Barkod okuma (kamera ile)
- [x] Barkod ile hızlı ürün arama
- [x] Barkod yazdırma
- [ ] Toplu barkod oluşturma

### 4. Satış Yönetimi
- [x] Yeni satış oluşturma
- [x] Sepet yönetimi
- [x] Fiyat hesaplama (KDV dahil)
- [x] İndirim uygulama
- [x] Ödeme alma (nakit, kart, havale)
- [ ] Fatura oluşturma
- [x] Satış geçmişi
- [ ] Günlük/aylık satış raporları

### 5. Müşteri Yönetimi
- [x] Müşteri kayıt/düzenleme
- [x] Müşteri arama
- [x] Müşteri geçmişi
- [ ] Müşteri kategorileri
- [x] Müşteri notları
- [x] Müşteri raporları

### 6. Tedarikçi Yönetimi
- [ ] Tedarikçi kayıt/düzenleme
- [ ] Tedarikçi ürün listesi
- [ ] Sipariş yönetimi
- [ ] Tedarikçi performans takibi

### 7. Raporlama ve Analiz
- [ ] Satış raporları
- [x] Stok raporları
- [x] Müşteri raporları
- [ ] Kâr/zarar analizi
- [ ] En çok satan ürünler
- [ ] Grafik ve dashboard
- [ ] Excel/PDF export

### 8. Bildirimler ve Uyarılar
- [x] Düşük stok uyarıları
- [ ] Satış bildirimleri
- [ ] Sistem uyarıları
- [ ] Email/SMS bildirimleri

## 📱 Platform Özellikleri

### Web Uygulaması
- [x] Responsive tasarım
- [ ] Dashboard
- [ ] Detaylı raporlama
- [ ] Toplu işlemler
- [x] Yazdırma desteği
- [ ] Klavye kısayolları

### iOS Uygulaması
- [ ] Barkod tarama
- [ ] Hızlı satış
- [ ] Stok kontrolü
- [ ] Push bildirimler
- [ ] Offline çalışma
- [ ] Kamera entegrasyonu

## 🔄 Veri Senkronizasyonu
- [ ] Real-time veri güncelleme
- [ ] Offline veri saklama
- [ ] Çakışma çözümleme
- [ ] Otomatik yedekleme
- [ ] Veri export/import

## 🛡️ Güvenlik
- [x] SSL/TLS şifreleme
- [x] API güvenliği
- [x] Veri şifreleme
- [ ] Backup stratejisi
- [x] Log yönetimi

## 📊 Performans Gereksinimleri
- [x] Sayfa yükleme süresi < 3 saniye
- [x] API yanıt süresi < 1 saniye
- [x] Eşzamanlı 10 kullanıcı desteği
- [ ] 99.9% uptime
- [ ] Mobil veri optimizasyonu

## 🎨 UI/UX Gereksinimleri
- [x] Modern ve temiz tasarım
- [x] Kolay kullanım
- [x] Türkçe arayüz
- [ ] Dark/Light tema
- [ ] Erişilebilirlik standartları
- [x] Mobil-first yaklaşım

## 📋 Yapılacaklar Listesi

### Faz 1: Temel Altyapı (2-3 hafta) ✅ TAMAMLANDI
- [x] Proje kurulumu ve konfigürasyon
- [x] Veritabanı tasarımı
- [x] Backend API geliştirme
- [x] Kullanıcı yönetimi
- [x] Temel CRUD işlemleri

### Faz 2: Stok Yönetimi (3-4 hafta) ✅ TAMAMLANDI
- [x] Ürün yönetimi
- [x] Kategori sistemi
- [x] Stok takibi
- [x] Barkod sistemi
- [x] Web arayüzü

### Faz 3: Satış Sistemi (2-3 hafta) ✅ TAMAMLANDI
- [x] Satış işlemleri
- [x] Müşteri yönetimi
- [ ] Fatura sistemi
- [x] Ödeme entegrasyonu

### Faz 4: Mobil Uygulama (3-4 hafta)
- [ ] React Native geliştirme
- [ ] Barkod tarama
- [ ] Offline çalışma
- [ ] Push bildirimler

### Faz 5: Raporlama ve Optimizasyon (2-3 hafta)
- [ ] Raporlama sistemi
- [ ] Dashboard
- [ ] Performans optimizasyonu
- [ ] Test ve hata düzeltme

### Faz 6: Deployment ve Yayın (1-2 hafta)
- [ ] Production deployment
- [ ] App Store yayını
- [ ] Dokümantasyon
- [ ] Kullanıcı eğitimi

## ✅ Yapıldılar

*Bu bölüm proje ilerledikçe güncellenecek*

- [x] PRD dokümanı hazırlandı
- [x] Proje kurulumu ve konfigürasyon
- [x] Veritabanı tasarımı (User, Product, Customer, Sale modelleri)
- [x] Backend API geliştirme (Express.js + SQLite)
- [x] Kullanıcı yönetimi (kayıt, giriş, çıkış)
- [x] JWT authentication sistemi
- [x] Input validation middleware
- [x] Güvenlik önlemleri (bcrypt, helmet, CORS)
- [x] Temel CRUD işlemleri (kullanıcılar, ürünler, müşteriler için)
- [x] Web arayüzü (React.js + Tailwind CSS)
- [x] Dashboard ve istatistikler
- [x] Responsive tasarım
- [x] Kullanıcı girişi ve kimlik doğrulama
- [x] Sidebar navigasyon
- [x] Toast bildirimleri
- [x] **Faz 2: Stok Yönetimi tamamlandı**
  - [x] Erkek tekstil ürün yönetimi
  - [x] Kategori ve alt kategori sistemi
  - [x] Renk, beden, sezon filtreleme
  - [x] Stok takibi ve düşük stok uyarıları
  - [x] Barkod sistemi entegrasyonu
  - [x] Barkod tarama (kamera + manuel)
  - [x] Barkod oluşturma ve yazdırma
  - [x] Kar marjı hesaplamaları
  - [x] İndirim sistemi
- [x] **Faz 3: Satış Sistemi tamamlandı**
  - [x] POS (Point of Sale) sistemi
  - [x] Sepet yönetimi
  - [x] Müşteri seçimi ve arama
  - [x] Ödeme yöntemleri (Nakit, Kart, Havale)
  - [x] Satış tamamlama
  - [x] Stok otomatik güncelleme
  - [x] Satış geçmişi
- [x] **Müşteri Yönetimi tamamlandı**
  - [x] Müşteri kayıt ve düzenleme
  - [x] Müşteri arama ve filtreleme
  - [x] Müşteri detay sayfası
  - [x] Müşteri satış geçmişi
  - [x] Bakiye yönetimi
  - [x] Müşteri istatistikleri

## 🧪 Test Stratejisi
- [x] Unit testler (validation.test.js)
- [ ] Integration testler
- [ ] UI testler
- [ ] Performance testler
- [ ] Security testler
- [ ] User acceptance testler

## 📚 Dokümantasyon
- [x] API dokümantasyonu (README.md)
- [ ] Kullanıcı kılavuzu
- [x] Teknik dokümantasyon (ARCHITECTURE.md)
- [ ] Deployment kılavuzu

## 🚀 Deployment ve Hosting
- [ ] Backend hosting (AWS/Azure)
- [ ] Database hosting
- [ ] CDN kurulumu
- [ ] SSL sertifikası
- [ ] Domain yönetimi

## 🗑️ Gereksiz Dosyalar ve Temizlik Önerileri

### Silinebilecek Dosyalar:
- `coverage/` - Test coverage raporları (development sırasında oluşur)
- `tests/` - Test dosyaları (sadece validation.test.js var, diğerleri boş)
- `logs/` - Log dosyaları (sadece .gitkeep var)
- `controllers/` - Controller dosyaları (BaseController ve ProductController, ama kullanılmıyor)
- `services/` - Service dosyaları (BaseService, UserService, ProductService, CustomerService, ama kullanılmıyor)

### Korunması Gereken Dosyalar:
- `models/` - Veritabanı modelleri (aktif kullanımda)
- `routes/` - API route'ları (aktif kullanımda)
- `middleware/` - Middleware dosyaları (aktif kullanımda)
- `utils/` - Utility fonksiyonları (aktif kullanımda)
- `config/` - Konfigürasyon dosyaları (aktif kullanımda)
- `frontend/` - Frontend uygulaması (aktif kullanımda)
- `server.js` - Ana sunucu dosyası
- `database.sqlite` - Veritabanı dosyası
- `package.json` - Bağımlılık yönetimi
- `README.md` - Dokümantasyon
- `PRD.md` - Proje gereksinimleri
- `ARCHITECTURE.md` - Mimari dokümantasyonu
